(function() {
  const themeKey = 'ppdb_theme';
  const root = document.documentElement;

  function readTheme() {
    try {
      return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  }

  function writeTheme(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem(themeKey, theme);
    } catch (error) {
      // The current page still changes theme when storage is unavailable.
    }
    updateButtons();
  }

  function updateButtons() {
    const isDark = root.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
      button.setAttribute('title', isDark ? 'Tema terang' : 'Tema gelap');
      button.setAttribute('aria-pressed', String(isDark));
      button.innerHTML = `<span aria-hidden="true" class="material-symbols-outlined">${isDark ? 'light_mode' : 'dark_mode'}</span><span class="ppdb-theme-label">${isDark ? 'Terang' : 'Gelap'}</span>`;
    });
  }

  function mountControls() {
    let toggles = Array.from(document.querySelectorAll('[data-theme-toggle]'));
    if (!toggles.length) {
      const profile = document.querySelector('header img[alt="Profile"]')?.parentElement;
      const host = profile?.parentElement;
      if (host) {
        const button = document.createElement('button');
        button.className = 'ppdb-theme-toggle';
        button.dataset.themeToggle = '';
        button.type = 'button';
        host.insertBefore(button, profile);
        toggles = [button];
      }
    }

    toggles.forEach(button => {
      if (button.dataset.themeBound) return;
      button.dataset.themeBound = 'true';
      button.addEventListener('click', () => writeTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
    });
    updateButtons();
  }

  root.dataset.theme = readTheme();
  const scriptUrl = document.currentScript?.src;
  if (scriptUrl && !document.querySelector('[data-ppdb-theme-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('../css/theme.css', scriptUrl).href;
    stylesheet.dataset.ppdbThemeStyles = '';
    document.head.appendChild(stylesheet);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountControls, { once: true });
  } else {
    mountControls();
  }
})();
