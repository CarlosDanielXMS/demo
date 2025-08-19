(function (global) {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, evt, cb) => el && el.addEventListener(evt, cb);

  function readJsonScript(id, fallback = []) {
    try { return JSON.parse(qs(`#${id}`)?.textContent ?? "[]"); }
    catch { return fallback; }
  }

  function filterTableByQuery(tableSel, query) {
    const rows = qsa(`${tableSel} tbody tr`);
    const q = query.trim().toLowerCase();
    rows.forEach(tr => {
      const show = !q || tr.textContent.toLowerCase().includes(q);
      tr.style.display = show ? "" : "none";
    });
  }

  global.App = global.App || {};
  global.App.Dom = { qs, qsa, on, readJsonScript, filterTableByQuery };
})(window);
