(function (global) {
  global.App = global.App || {};
  const Dom = (global.App && global.App.Dom) || {};
  const qs  = Dom.qs  || ((sel, root = document) => root.querySelector(sel));
  const qsa = Dom.qsa || ((sel, root = document) => Array.from(root.querySelectorAll(sel)));
  const on  = Dom.on  || ((el, evt, cb) => el && el.addEventListener(evt, cb));

  const root = document.documentElement;
  const THEME_KEY = 'theme';
  const DARK_CLASS = 'theme-dark';

  const subscribers = [];

  function prefersDark() {
    return !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function getStored() {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  }
  function setStored(mode) {
    try { localStorage.setItem(THEME_KEY, mode); } catch {}
  }
  function get() {
    return root.classList.contains(DARK_CLASS) ? 'dark' : 'light';
  }
  function dispatch(mode) {
    try {
      document.dispatchEvent(new CustomEvent('app:themechange', { detail: { mode } }));
    } catch {}
    subscribers.forEach(fn => { try { fn(mode); } catch {} });
  }

  function updateToggleVisuals(mode) {
    const btns = qsa('#themeToggle, [data-theme-toggle]');
    btns.forEach(btn => {
      const icon = qs('.material-icons, [data-icon]', btn);
      if (icon) {
        if (icon.classList && icon.classList.contains('material-icons')) {
          icon.textContent = (mode === 'dark') ? 'light_mode' : 'dark_mode';
        } else {
          icon.setAttribute('data-icon', (mode === 'dark') ? 'light_mode' : 'dark_mode');
        }
      }
      const label = qs('[data-theme-label]', btn);
      if (label) label.textContent = (mode === 'dark') ? 'Tema claro' : 'Tema escuro';
    });
  }

  function apply(mode, { persist = true, emit = true } = {}) {
    if (mode === 'system') mode = prefersDark() ? 'dark' : 'light';

    if (mode === 'dark') root.classList.add(DARK_CLASS);
    else root.classList.remove(DARK_CLASS);

    if (persist && (mode === 'dark' || mode === 'light')) setStored(mode);

    updateToggleVisuals(mode);
    if (emit) dispatch(mode);
    return mode;
  }

  function toggle() {
    return apply(get() === 'dark' ? 'light' : 'dark');
  }

  (function initialApply() {
    const stored = getStored();
    const fromClass = root.classList.contains(DARK_CLASS);
    const initial =
      (stored === 'dark' || stored === 'light') ? stored :
      (fromClass ? 'dark' : (prefersDark() ? 'dark' : 'light'));
    apply(initial, { persist: !!stored, emit: false });
  })();

  function bindToggles() {
    const btns = qsa('#themeToggle, [data-theme-toggle]');
    btns.forEach(btn => on(btn, 'click', (e) => { e.preventDefault(); toggle(); }));
    updateToggleVisuals(get());
  }

  function bindSystemChangeIfNeeded() {
    const stored = getStored();
    if (!stored && global.matchMedia) {
      const mq = global.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => apply(e.matches ? 'dark' : 'light', { persist: false });
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq.addListener) mq.addListener(handler);
    }
  }

  function init() {
    apply(get(), { persist: false, emit: true });
    bindToggles();
    bindSystemChangeIfNeeded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.App.Theme = {
    init,
    apply,
    toggle,
    get,
    set: (mode) => {
      if (!['light','dark','system'].includes(mode)) {
        throw new Error('App.Theme.set(mode): use "light" | "dark" | "system".');
      }
      return apply(mode);
    },
    onChange: (cb) => {
      if (typeof cb === 'function') {
        subscribers.push(cb);
        return () => {
          const i = subscribers.indexOf(cb);
          if (i >= 0) subscribers.splice(i, 1);
        };
      }
      return () => {};
    }
  };
})(window);
