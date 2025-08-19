(function () {
  const root = document.documentElement;
  const THEME_KEY = 'theme';

  function apply(mode) {
    if (mode === 'dark') {
      root.classList.add('theme-dark');
    } else {
      root.classList.remove('theme-dark');
    }
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch (e) { /* ignore */ }

    // Ajusta ícone do botão, se existir
    const btn = document.getElementById('themeToggle');
    if (btn) {
      const icon = btn.querySelector('.material-icons');
      if (icon) icon.textContent = (mode === 'dark') ? 'light_mode' : 'dark_mode';
    }
  }

  // Estado inicial: respeita classe já aplicada pelo inline + atualiza ícone
  document.addEventListener('DOMContentLoaded', function () {
    const isDark = root.classList.contains('theme-dark');
    apply(isDark ? 'dark' : 'light');

    // Alternância manual
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const newMode = root.classList.contains('theme-dark') ? 'light' : 'dark';
        apply(newMode);
      });
    }

    // Reage a mudança do SO se o usuário não tiver preferência salva
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const stored = (function () {
        try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
      })();
      const onChange = function (e) {
        if (!stored) apply(e.matches ? 'dark' : 'light');
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  });
})();
