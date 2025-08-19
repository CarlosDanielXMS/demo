(function (global) {
  function open(modalEl) {
    if (!modalEl) return;
    modalEl.style.display = "flex";
  }
  function close(modalEl) {
    if (!modalEl) return;
    modalEl.style.display = "none";
  }
  function bindBasic(modalEl, closeSelector) {
    if (!modalEl) return;
    const closeBtn = modalEl.querySelector(closeSelector);
    if (closeBtn) closeBtn.addEventListener("click", () => close(modalEl));
    modalEl.addEventListener("click", (e) => { if (e.target === modalEl) close(modalEl); });
  }
  window.App = window.App || {};
  window.App.Modal = { open, close, bindBasic };
})(window);
