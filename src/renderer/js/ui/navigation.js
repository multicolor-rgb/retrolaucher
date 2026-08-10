// Nawigacja między platformami i przełączanie głównych widoków.

function moveHighlight(tabEl) {
  if (!tabEl) return;
  tabHighlight.style.left = tabEl.offsetLeft + 'px';
  tabHighlight.style.width = tabEl.offsetWidth + 'px';
}

function getPlatformGameCount(platformKey) {
  return games.filter(game => game.platform === platformKey).length;
}

function usedPlatforms() {
  const usedKeys = new Set(games.map(g => g.platform));
  return config.platforms.filter(p => usedKeys.has(p.key));
}

function closeDropdown() {
  document.getElementById('platformDropdown').classList.remove('open');
}

function renderPlatformDropdown() {
  const menu = document.getElementById('platformDropdownMenu');
  const label = document.getElementById('platformDropdownLabel');
  const dropdownBtn = document.getElementById('platformDropdownBtn');

  menu.innerHTML = '';

  usedPlatforms().forEach(p => {
    const count = getPlatformGameCount(p.key);

    const item = document.createElement('div');
    item.className = 'pd-item' + (
      activePlatform === p.key ? ' active' : ''
    );

    item.textContent = `${p.label} (${count})`;

    item.addEventListener('click', () => {
      applyFilter(p.key, null);
      closeDropdown();
    });

    menu.appendChild(item);
  });

  const currentPlatform = config.platforms.find(
    p => p.key === activePlatform
  );

  const currentCount = activePlatform === 'all'
    ? games.length
    : getPlatformGameCount(activePlatform);

  label.textContent = currentPlatform
    ? `${currentPlatform.label} (${currentCount})`
    : `${t('platforms')} (${games.length})`;

  dropdownBtn.classList.toggle('active', activePlatform !== 'all');
}

function renderTabs() {
  tabsContainer.innerHTML = '';
  tabsContainer.appendChild(tabHighlight);

  const allTab = document.createElement('div');
  allTab.className = 'tab' + (activePlatform === 'all' ? ' active' : '');
  allTab.dataset.platform = 'all';
  allTab.title = t('all');
  allTab.innerHTML = `<span class="tab-label">${t('all')}</span>`;
  allTab.addEventListener('click', () => applyFilter('all', allTab));
  tabsContainer.appendChild(allTab);

  const activeTab = tabsContainer.querySelector('.tab.active');
  if (activeTab) moveHighlight(activeTab);

  renderPlatformDropdown();
}

function applyFilter(platform, tabEl) {
  if (platform === activePlatform) return;

  activePlatform = platform;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  if (tabEl) {
    tabEl.classList.add('active');
    moveHighlight(tabEl);
  } else {
    document.getElementById('tabHighlight').style.width = '0px';
  }

  renderPlatformDropdown();

  shelf.classList.add('switching');
  shelfInfo.classList.add('switching');

  setTimeout(() => {
    filtered = platform === 'all' ? games : games.filter(g => g.platform === platform);
    current = 0;
    renderShelf();

    shelf.classList.remove('switching');
    shelfInfo.classList.remove('switching');
  }, 260);
}

function starString(rating) {
  const full = Math.round(rating / 2);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}


