// Retro Launcher 2.0 — backend Tauri.
//
// Port logiki z Electrona (src/main/main.js) 1:1:
//  - config / playtime w ~/.config/retro-launcher (pełna zgodność ze starymi instalacjami),
//  - skanowanie ROM-ów, cache okładek, uruchamianie/kasowanie emulatorów,
//  - fullscreen / chowanie okna nad grą i przywracanie po wyjściu emulatora,
//  - watchdog pada (L3+R3+LB+RB = stop) zamiast ukrytego okna input-watch,
//  - emulator_test (w Electronie handler 'emulator:test' w ogóle nie istniał, tu działa).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::{json, Value};
use std::collections::HashSet;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Mutex;
use std::time::Duration;
use sha1::{Digest, Sha1};
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow, WindowEvent};
use unicode_normalization::UnicodeNormalization;

// ---------------------------------------------------------------- stan

#[derive(Default)]
struct LauncherState {
    last_pid: AtomicU32,
    last_command: Mutex<Option<String>>,
    game_running: AtomicBool,
    was_fullscreen: AtomicBool,
}

// ---------------------------------------------------------------- util

fn data_dir(app: &AppHandle) -> PathBuf {
    if let Ok(dir) = app.path().app_config_dir() {
        return dir;
    }
    // fallback — identyczny z Electron userData
    home_dir().join(".config").join("retro-launcher")
}

fn home_dir() -> PathBuf {
    match std::env::var("HOME") {
        Ok(h) if !h.is_empty() => PathBuf::from(h),
        _ => PathBuf::from("."),
    }
}

fn ensure_data_files(app: &AppHandle) {
    let dir = data_dir(app);
    let _ = fs::create_dir_all(&dir);
}

fn config_path(app: &AppHandle) -> PathBuf {
    data_dir(app).join("retro-launcher-config.json")
}

fn playtime_path(app: &AppHandle) -> PathBuf {
    data_dir(app).join("retro-launcher-playtime.json")
}

fn read_json_safe(path: &Path, fallback: Value) -> Value {
    match fs::read_to_string(path) {
        Ok(text) => serde_json::from_str(&text).unwrap_or(fallback),
        Err(_) => fallback,
    }
}

fn write_json_safe(path: &Path, data: &Value) {
    if let Ok(text) = serde_json::to_string_pretty(data) {
        let _ = fs::write(path, text);
    }
}

// odpowiednik sanitizeFileName / sanitizeGameIdPart z main.js
fn sanitize(name: &str) -> String {
    let stripped: String = name.nfd().filter(|c| !unicode_normalization::char::is_combining_mark(*c)).collect();
    let mut out = String::new();
    let mut last_dash = true;
    for ch in stripped.chars() {
        if ch.is_ascii_alphanumeric() || ch == '.' || ch == '_' || ch == '-' {
            out.push(ch.to_ascii_lowercase());
            last_dash = false;
        } else if !last_dash {
            out.push('-');
            last_dash = true;
        }
    }
    out.trim_matches('-').to_string()
}

fn stable_game_id(relative_path: &str) -> String {
    let mut hasher = Sha1::new();
    hasher.update(relative_path.as_bytes());
    let digest = hasher.finalize();
    digest.iter().map(|b| format!("{:02x}", b)).collect()
}

// Tokenizacja komendy z zachowaniem cudzysłowów (parseCommandString z main.js).
fn parse_command_string(value: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut word = String::new();
    let mut in_word = false;
    let mut quote: Option<char> = None;
    let mut quoted = false;
    for ch in value.chars() {
        match quote {
            Some(q) => {
                if ch == q {
                    tokens.push(word.clone());
                    word.clear();
                    in_word = false;
                    quote = None;
                    quoted = true;
                } else {
                    word.push(ch);
                    in_word = true;
                }
            }
            None => {
                if ch == ' ' || ch == '\t' {
                    if in_word {
                        tokens.push(word.clone());
                        word.clear();
                        in_word = false;
                    }
                } else if ch == '"' || ch == '\'' {
                    quote = Some(ch);
                    in_word = true;
                } else {
                    word.push(ch);
                    in_word = true;
                }
            }
        }
    }
    if in_word {
        tokens.push(word);
    } else if quoted && !word.is_empty() {
        tokens.push(word);
    }
    tokens.retain(|t| !t.is_empty() || quoted);
    tokens
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

// ---------------------------------------------------------------- playtime

fn read_playtime_store(app: &AppHandle) -> Value {
    let mut data = read_json_safe(&playtime_path(app), json!({ "playtime": {} }));
    if data.get("playtime").is_none() {
        data["playtime"] = json!({});
    }
    data
}

fn write_playtime_store(app: &AppHandle, data: &Value) {
    write_json_safe(&playtime_path(app), data);
}

fn get_playtime_entry(app: &AppHandle, game_id: &str) -> Value {
    read_playtime_store(app)["playtime"]
        .get(game_id)
        .cloned()
        .unwrap_or_else(|| json!({ "totalMs": 0, "lastStartAt": null, "running": false }))
}

fn set_playtime_entry(app: &AppHandle, game_id: &str, entry: Value) {
    let mut store = read_playtime_store(app);
    store["playtime"][game_id] = entry;
    write_playtime_store(app, &store);
}

fn start_playtime(app: &AppHandle, game_id: &str) {
    if game_id.is_empty() {
        return;
    }
    let mut entry = get_playtime_entry(app, game_id);
    if !entry["running"].as_bool().unwrap_or(false) {
        entry["running"] = json!(true);
        entry["lastStartAt"] = json!(now_ms());
        set_playtime_entry(app, game_id, entry);
    }
}

fn stop_playtime(app: &AppHandle, game_id: &str) {
    if game_id.is_empty() {
        return;
    }
    let mut entry = get_playtime_entry(app, game_id);
    if entry["running"].as_bool().unwrap_or(false) {
        if let Some(start) = entry["lastStartAt"].as_i64() {
            let total = entry["totalMs"].as_i64().unwrap_or(0);
            entry["totalMs"] = json!(total + (now_ms() - start));
        }
        entry["running"] = json!(false);
        entry["lastStartAt"] = json!(null);
        set_playtime_entry(app, game_id, entry);
    }
}

fn get_current_playtime_ms(app: &AppHandle, game_id: &str) -> i64 {
    let entry = get_playtime_entry(app, game_id);
    let total = entry["totalMs"].as_i64().unwrap_or(0);
    let running_ms = if entry["running"].as_bool().unwrap_or(false) {
        entry["lastStartAt"]
            .as_i64()
            .map(|s| now_ms() - s)
            .unwrap_or(0)
    } else {
        0
    };
    total + running_ms
}

fn format_playtime(ms: i64) -> String {
    let total_seconds = (ms / 1000).max(0);
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    let seconds = total_seconds % 60;
    if hours > 0 {
        format!("{}h {:02}m", hours, minutes)
    } else if minutes > 0 {
        format!("{}m {:02}s", minutes, seconds)
    } else {
        format!("{}s", seconds)
    }
}

// ---------------------------------------------------------------- okno: chowanie / przywracanie

fn hide_launcher_for_game(window: &WebviewWindow, state: &LauncherState) {
    state
        .was_fullscreen
        .store(window.is_fullscreen().unwrap_or(false), Ordering::SeqCst);
    let _ = window.hide();
    let _ = window.emit("app:window-blur", ());
}

fn show_launcher(window: &WebviewWindow, state: &LauncherState) {
    let was_fullscreen = state.was_fullscreen.swap(false, Ordering::SeqCst);
    let _ = window.show();
    if was_fullscreen {
        let _ = window.set_fullscreen(true);
    } else {
        let _ = window.unminimize();
    }
    let _ = window.set_focus();
    let _ = window.emit("app:window-focus", ());
}

// ---------------------------------------------------------------- emulator: spawn / kill

fn is_flatpak() -> bool {
    cfg!(target_os = "linux") && (std::env::var("FLATPAK_ID").is_ok() || Path::new("/.flatpak-info").exists())
}

fn build_spawn_command(command: &str, args: &mut Vec<String>) -> (String, Vec<String>) {
    if is_flatpak() {
        let mut out = vec![command.to_string()];
        out.append(args);
        let full = [vec!["--host".to_string()], out].concat();
        return ("flatpak-spawn".into(), full);
    }
    (command.into(), args.clone())
}

#[cfg(target_family = "unix")]
fn spawn_emulator(command: &str, args: &mut Vec<String>) -> Result<std::process::Child, String> {
    use std::os::unix::process::CommandExt;
    let (cmd, argv) = build_spawn_command(command, args);
    let mut c = Command::new(cmd);
    c.args(argv)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    // własna grupa procesów → kill(-pid)
    c.process_group(0);
    c.spawn().map_err(|e| e.to_string())
}

#[cfg(target_family = "windows")]
fn spawn_emulator(command: &str, args: &mut Vec<String>) -> Result<std::process::Child, String> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    const CREATE_NEW_PROCESS_GROUP: u32 = 0x0000_0200;
    let (cmd, argv) = build_spawn_command(command, args);
    let mut c = Command::new(cmd);
    c.args(argv)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP);
    c.spawn().map_err(|e| e.to_string())
}

// emulator: SIGTERM grupie procesów, po 1,2 s SIGKILL — jak w main.js.
#[cfg(target_family = "unix")]
fn kill_last_pid(state: &LauncherState) -> bool {
    let pid = state.last_pid.load(Ordering::SeqCst);
    if pid == 0 {
        return false;
    }
    let neg = -(pid as i32);
    let terminated =
        unsafe { libc::kill(neg, libc::SIGTERM) == 0 } || unsafe { libc::kill(pid as i32, libc::SIGTERM) == 0 };
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(1200));
        unsafe {
            let _ = libc::kill(-(pid as i32), libc::SIGKILL);
            let _ = libc::kill(pid as i32, libc::SIGKILL);
        }
    });
    terminated
}

#[cfg(target_family = "windows")]
fn kill_last_pid(state: &LauncherState) -> bool {
    let pid = state.last_pid.load(Ordering::SeqCst);
    if pid == 0 {
        return false;
    }
    Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/F", "/T"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(0x0800_0000)
        .spawn()
        .is_ok()
}

// ---------------------------------------------------------------- watchdog pada (zamiast okna input-watch)

#[cfg(target_family = "unix")]
const COMBO: [u16; 4] = [
    310, // BTN_TL    = LB
    311, // BTN_TR    = RB
    317, // BTN_THUMBL = L3
    318, // BTN_THUMBR = R3
];

#[cfg(target_family = "unix")]
fn gamepad_watchdog(app: AppHandle) {
    let watched: Mutex<HashSet<String>> = Mutex::new(HashSet::new());
    loop {
        if let Ok(entries) = fs::read_dir("/dev/input") {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if !name.starts_with("event") {
                    continue;
                }
                let path = entry.path();
                let path_str = path.to_string_lossy().to_string();
                {
                    let mut set = match watched.lock() {
                        Ok(s) => s,
                        Err(_) => continue,
                    };
                    if set.contains(&path_str) {
                        continue;
                    }
                    set.insert(path_str.clone());
                }
                // nowy/istniejący pad → własny wątek kontrolujący stop-kombo
                let app2 = app.clone();
                std::thread::spawn(move || watch_pad_device(app2, &path, &COMBO));
            }
        }
        std::thread::sleep(Duration::from_secs(2));
    }
}

#[cfg(target_family = "unix")]
fn watch_pad_device(app: AppHandle, path: &Path, combo: &[u16]) {
    let Ok(mut device) = evdev::Device::open(path) else { return };
    // tylko gamepady (klawisze BTN_A..BTN_THUMBR = 304..318)
    let is_pad = device
        .supported_keys()
        .map(|ks| ks.iter().any(|k| (k.code() >= 304) && (k.code() <= 318)))
        .unwrap_or(false);
    if !is_pad {
        return;
    }
    let Ok(events) = device.fetch_events() else { return };
    let mut pressed: HashSet<u16> = HashSet::new();
    let mut latched = false;
    for ev in events {
        if ev.event_type() == evdev::EventType::KEY {
            let (code, value) = (ev.code(), ev.value());
            if combo.contains(&code) {
                if value != 0 {
                    pressed.insert(code);
                } else {
                    pressed.remove(&code);
                }
                if pressed.len() == combo.len() && !latched {
                    latched = true;
                    let state: State<LauncherState> = app.state();
                    kill_last_pid(&state);
                } else if pressed.is_empty() {
                    latched = false;
                }
            }
        }
    }
}

#[cfg(target_family = "windows")]
fn gamepad_watchdog(_app: AppHandle) {
    // Windows: XInput polling docelowo; stop-kombo przy schowanym oknie
    // w tej wersji tylko gdy okno jest aktywne (renderer). No-op backendu.
}

// ---------------------------------------------------------------- komendy IPC

#[tauri::command]
fn config_load(app: AppHandle) -> Value {
    let p = config_path(&app);
    if p.exists() {
        read_json_safe(&p, Value::Null)
    } else {
        Value::Null
    }
}

#[tauri::command]
fn config_save(app: AppHandle, config: Value) -> Value {
    let p = config_path(&app);
    match serde_json::to_string_pretty(&config) {
        Ok(text) => match fs::write(&p, text) {
            Ok(_) => json!({ "ok": true }),
            Err(e) => json!({ "ok": false, "error": e.to_string() }),
        },
        Err(e) => json!({ "ok": false, "error": e.to_string() }),
    }
}

fn do_set_fullscreen(window: &WebviewWindow, next: Option<bool>) -> Value {
    let target = match next {
        Some(v) => v,
        None => !window.is_fullscreen().unwrap_or(false),
    };
    match window.set_fullscreen(target) {
        Ok(_) => json!({ "ok": true, "fullscreen": target }),
        Err(e) => json!({ "ok": false, "error": e.to_string() }),
    }
}

#[tauri::command]
fn window_toggle_fullscreen(window: WebviewWindow) -> Value {
    do_set_fullscreen(&window, None)
}

#[tauri::command]
fn window_get_fullscreen_state(window: WebviewWindow) -> Value {
    match window.is_fullscreen() {
        Ok(f) => json!({ "ok": true, "fullscreen": f }),
        Err(e) => json!({ "ok": false, "fullscreen": false, "error": e.to_string() }),
    }
}

#[tauri::command]
fn window_set_fullscreen(window: WebviewWindow, value: bool) -> Value {
    do_set_fullscreen(&window, Some(value))
}

// cacheRemoteImage — odpowiednik z main.js: covers/<platform>/<title>__<aspect><ext>
#[tauri::command]
fn image_cache_remote(
    app: AppHandle,
    url: String,
    platform_key: Option<String>,
    game_title: Option<String>,
    aspect: Option<String>,
) -> Value {
    let path_part = url.split("://").nth(1).map(|rest| rest.to_string()).unwrap_or_default();
    let last_seg = path_part.rsplit('/').next().unwrap_or("");
    let ext = match last_seg.rfind('.') {
        Some(i) => last_seg[i..].to_lowercase(),
        None => ".png".to_string(),
    };
    let safe_platform = sanitize(platform_key.as_deref().unwrap_or("unknown"));
    let safe_title = sanitize(game_title.as_deref().unwrap_or("game"));
    let safe_aspect = sanitize(aspect.as_deref().unwrap_or("standard"));

    let dir = data_dir(&app).join("covers").join(&safe_platform);
    if fs::create_dir_all(&dir).is_err() {
        return json!({ "ok": false, "error": "Nie można utworzyć katalogu okładek." });
    }
    let file_path = dir.join(format!("{}__{}{}", safe_title, safe_aspect, ext));

    match download_to_buffer(&url) {
        Ok(bytes) => {
            if let Err(e) = fs::write(&file_path, &bytes) {
                return json!({ "ok": false, "error": e.to_string() });
            }
            json!({
                "ok": true,
                "filePath": file_path.to_string_lossy().to_string(),
            })
        }
        Err(e) => json!({ "ok": false, "error": e }),
    }
}

fn download_to_buffer(url: &str) -> Result<Vec<u8>, String> {
    let resp = ureq::get(url)
        .timeout(Duration::from_secs(30))
        .call()
        .map_err(|e| format!("Nie udało się pobrać obrazka: {}", e))?;
    let mut buf = Vec::new();
    resp.into_reader()
        .take(32 * 1024 * 1024)
        .read_to_end(&mut buf)
        .map_err(|e| e.to_string())?;
    Ok(buf)
}

// Fallback HTTP (gdyby webview zablokował CORS w fetch).
#[derive(serde::Deserialize)]
struct ProxyRequest {
    url: String,
    #[serde(default = "default_method")]
    method: String,
    #[serde(default)]
    headers: std::collections::HashMap<String, String>,
}

fn default_method() -> String {
    "GET".into()
}

#[tauri::command]
fn http_proxy(req: ProxyRequest) -> Value {
    let url = req.url.trim().to_string();
    let call = match req.method.to_uppercase().as_str() {
        "GET" => Some(ureq::get(&url)),
        "POST" => Some(ureq::post(&url)),
        "PUT" => Some(ureq::put(&url)),
        _ => None,
    };
    let Some(call) = call else {
        return json!({ "ok": false, "error": "Unsupported method" });
    };
    let mut call = call.timeout(Duration::from_secs(30));
    for (k, v) in req.headers.iter() {
        call = call.set(k, v);
    }
    match call.call() {
        Ok(resp) => {
            let status = resp.status();
            let body = resp.into_string().unwrap_or_default();
            json!({ "ok": status < 400, "status": status, "body": body })
        }
        Err(ureq::Error::Status(status, resp)) => {
            let body = resp.into_string().unwrap_or_default();
            json!({ "ok": status < 400, "status": status, "body": body })
        }
        Err(e) => json!({ "ok": false, "error": e.to_string() }),
    }
}

#[tauri::command]
fn roms_scan(folder_path: String, extensions: Option<Vec<String>>) -> Vec<Value> {
    let root = PathBuf::from(&folder_path);
    let mut out: Vec<Value> = Vec::new();
    if !root.is_dir() {
        return out;
    }
    let normalized: HashSet<String> = extensions
        .unwrap_or_default()
        .iter()
        .map(|e| {
            let e = e.trim().to_lowercase();
            if e.starts_with('.') {
                e
            } else if e.is_empty() {
                String::new()
            } else {
                format!(".{}", e)
            }
        })
        .filter(|e| !e.is_empty())
        .collect();
    scan_files_recursive(&root, &normalized, &root, &mut out);
    out.sort_by(|a, b| {
        let ta = a["title"].as_str().unwrap_or("").to_lowercase();
        let tb = b["title"].as_str().unwrap_or("").to_lowercase();
        ta.cmp(&tb)
    });
    out
}

fn scan_files_recursive(root: &Path, exts: &HashSet<String>, base_dir: &Path, out: &mut Vec<Value>) {
    let Ok(entries) = fs::read_dir(root) else { return };
    for entry in entries.flatten() {
        let full_path = entry.path();
        let file_type = match entry.file_type() {
            Ok(t) => t,
            Err(_) => continue,
        };
        if file_type.is_dir() {
            if let Some(name) = full_path.file_name() {
                let dir_name = name.to_string_lossy().to_lowercase();
                if dir_name == ".git" || dir_name == "$recycle.bin" {
                    continue;
                }
            }
            scan_files_recursive(&full_path, exts, base_dir, out);
            continue;
        }
        let file_name = entry.file_name().to_string_lossy().to_string();
        let ext = full_path
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy().to_lowercase()))
            .unwrap_or_else(|| String::new());
        if !exts.is_empty() && !exts.contains(&ext) {
            continue;
        }
        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let base_title = full_path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or(file_name.clone());
        let relative_path = full_path
            .strip_prefix(base_dir)
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| file_name.clone());
        let id = stable_game_id(&relative_path);
        let full_str = full_path.to_string_lossy().to_string();
        let mtime = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0);
        out.push(json!({
            "id": id,
            "title": base_title,
            "rom": full_str.clone(),
            "location": full_str,
            "relativePath": relative_path,
            "fileName": file_name,
            "ext": ext,
            "size": meta.len() as i64,
            "bytes": meta.len() as i64,
            "mtimeMs": mtime,
        }));
    }
}

#[tauri::command]
fn game_launch(
    app: AppHandle,
    window: WebviewWindow,
    game_id: Option<String>,
    emulator_path: String,
    rom_path: String,
    extra_args: Option<Vec<String>>,
) -> Value {
    if emulator_path.is_empty() {
        return json!({ "ok": false, "error": "Nie skonfigurowano emulatora dla tej platformy." });
    }
    let mut tokens = parse_command_string(&emulator_path);
    let Some(command) = tokens.first().cloned() else {
        return json!({ "ok": false, "error": "Nieprawidłowe polecenie emulatora." });
    };
    let mut rest = tokens.split_off(1);
    if let Some(extra) = extra_args {
        rest.extend(extra.into_iter().filter(|a| !a.is_empty()));
    }
    if !rom_path.is_empty() {
        rest.push(rom_path);
    }

    let child = match spawn_emulator(&command, &mut rest) {
        Ok(c) => c,
        Err(e) => return json!({ "ok": false, "error": e }),
    };
    let pid = child.id();
    let game_id = game_id.unwrap_or_default();

    {
        let state: State<LauncherState> = app.state();
        state.last_pid.store(pid, Ordering::SeqCst);
        *state.last_command.lock().unwrap() = Some(command);
        state.game_running.store(true, Ordering::SeqCst);

        if !game_id.is_empty() {
            start_playtime(&app, &game_id);
        }
    }

    // wątek czeka na wyjście emulatora (reap + stop playtime + przywrócenie okna)
    let thread_app = app.clone();
    let thread_window = window.clone();
    std::thread::spawn(move || {
        let mut child = child;
        let _ = child.wait();
        let app = thread_app;
        let window = thread_window;
        let state: State<LauncherState> = app.state();
        if !game_id.is_empty() {
            stop_playtime(&app, &game_id);
        }
        state.game_running.store(false, Ordering::SeqCst);
        state.last_pid.store(0, Ordering::SeqCst);
        *state.last_command.lock().unwrap() = None;
        show_launcher(&window, &state);
    });

    {
        let state: State<LauncherState> = app.state();
        hide_launcher_for_game(&window, &state);
    }
    json!({ "ok": true, "pid": pid })
}

#[tauri::command]
fn game_stop_last(app: AppHandle) -> Value {
    let state: State<LauncherState> = app.state();
    let requested = kill_last_pid(&state);
    json!({ "ok": true, "requested": requested })
}

// 'emulator:test' — w Electronie handler 'emulator:test' w ogóle nie istniał,
// tu realnie uruchamia emulator bez ROM-u i bez chowania okna.
#[tauri::command]
fn emulator_test(emulator_path: String, extra_args: Option<Vec<String>>) -> Value {
    if emulator_path.is_empty() {
        return json!({ "ok": false, "error": "Nie skonfigurowano emulatora." });
    }
    let mut tokens = parse_command_string(&emulator_path);
    let Some(command) = tokens.first().cloned() else {
        return json!({ "ok": false, "error": "Nieprawidłowe polecenie emulatora." });
    };
    let mut rest = tokens.split_off(1);
    if let Some(extra) = extra_args {
        rest.extend(extra.into_iter().filter(|a| !a.is_empty()));
    }
    match spawn_emulator(&command, &mut rest) {
        // pokrewny wątek czeka na wyjście procesu — zapobiega zombie
        Ok(child) => {
            std::thread::spawn(move || {
                let mut child = child;
                let _ = child.wait();
            });
            json!({ "ok": true })
        }
        Err(e) => json!({ "ok": false, "error": e }),
    }
}

#[tauri::command]
fn game_focus(app: AppHandle, window: WebviewWindow) -> Value {
    let state: State<LauncherState> = app.state();
    if state.last_pid.load(Ordering::SeqCst) == 0 {
        return json!({ "ok": false, "error": "Brak ostatnio uruchomionego procesu." });
    }
    hide_launcher_for_game(&window, &state);
    json!({ "ok": true })
}

#[tauri::command]
fn game_last_pid(app: AppHandle) -> Value {
    let state: State<LauncherState> = app.state();
    json!({
        "pid": state.last_pid.load(Ordering::SeqCst),
        "command": state.last_command.lock().unwrap().clone().unwrap_or_default(),
    })
}

#[tauri::command]
fn game_get_playtime(app: AppHandle, game_id: String) -> Value {
    if game_id.is_empty() {
        return json!({ "ok": false, "error": "Brak gameId." });
    }
    let total = get_current_playtime_ms(&app, &game_id);
    json!({ "ok": true, "totalMs": total, "formatted": format_playtime(total) })
}

#[tauri::command]
fn game_get_playtime_raw(app: AppHandle, game_id: String) -> Value {
    if game_id.is_empty() {
        return json!({ "ok": false, "error": "Brak gameId." });
    }
    json!({ "ok": true, "entry": get_playtime_entry(&app, &game_id) })
}

// ---------------------------------------------------------------- start aplikacji

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            ensure_data_files(&handle);

            // zasilenie plików konfiguracji przy pierwszym starcie
            let cfg_path = config_path(&handle);
            if !cfg_path.exists() {
                write_json_safe(&cfg_path, &json!({ "uiState": { "fullscreenOnLaunch": false } }));
            }
            let pt_path = playtime_path(&handle);
            if !pt_path.exists() {
                write_json_safe(&pt_path, &json!({ "playtime": {} }));
            }

            if let Some(win) = handle.get_webview_window("main") {
                let cfg = read_json_safe(&cfg_path, json!({}));
                let fullscreen = cfg
                    .get("uiState")
                    .and_then(|u| u.get("fullscreenOnLaunch"))
                    .and_then(|f| f.as_bool())
                    .unwrap_or(false);
                if fullscreen {
                    let _ = win.set_fullscreen(true);
                }

                // focus/blur zdarzeń okno →renderer (jak w main.js emitWindowState)
                let handle2 = handle.clone();
                win.on_window_event(move |ev| {
                    if let WindowEvent::Focused(focused) = ev {
                        let _ = handle2.emit(
                            if *focused { "app:window-focus" } else { "app:window-blur" },
                            (),
                        );
                    }
                });
            }

            // watchdog pada — zamiast input-watch (ukryte okno w Electronie)
            let watchdog_handle = handle.clone();
            std::thread::spawn(move || gamepad_watchdog(watchdog_handle));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config_load,
            config_save,
            window_toggle_fullscreen,
            window_get_fullscreen_state,
            window_set_fullscreen,
            image_cache_remote,
            http_proxy,
            roms_scan,
            game_launch,
            game_stop_last,
            emulator_test,
            game_focus,
            game_last_pid,
            game_get_playtime,
            game_get_playtime_raw,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
