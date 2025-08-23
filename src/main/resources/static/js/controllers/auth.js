(function(global) {
  'use strict';

  global.App = global.App || {};
  const App = global.App;
  const { Dom } = App;

  function showError(msg) {
    const box = document.getElementById('login-error');
    if (!box) return;
    box.textContent = msg || 'Não foi possível efetuar o login.';
    box.style.display = 'block';
    box.setAttribute('role', 'alert');
  }

  function clearError() {
    const box = document.getElementById('login-error');
    if (!box) return;
    box.textContent = '';
    box.style.display = 'none';
    box.removeAttribute('role');
  }

  async function handleLogin(event) {
    event.preventDefault();

    clearError();

    const form = event.target;
    const email = form.email.value.trim();
    const senha = form.senha.value.trim();

    if (!email || !senha) {
      showError('Informe e-mail e senha.');
      (email ? form.senha : form.email).focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    try {
      form.classList.add('is-submitting');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset._originalText = submitBtn.textContent;
        submitBtn.textContent = 'Entrando...';
      }

      await App.Api.Auth.login({ email, senha });

      window.location.href = '/agendamentos';
    } catch (error) {
      let errorMsg = 'Não foi possível efetuar o login.';
      if (error && error.data && typeof error.data === 'object') {
        if (error.data.erro) errorMsg = String(error.data.erro);
        else if (error.data.message) errorMsg = String(error.data.message);
      } else if (error && typeof error.data === 'string' && error.data.trim()) {
        errorMsg = error.data;
      } else if (error && error.message) {
        errorMsg = error.message;
      }
      showError(errorMsg);
    } finally {
      form.classList.remove('is-submitting');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset._originalText || 'Entrar';
      }
    }
  }

  function bindLoginForm(formSelector = '#login-form') {
    const form = document.querySelector(formSelector);
    if (!form) return;
    form.addEventListener('submit', handleLogin);
  }

  async function handleLogout(e) {
    if (e) e.preventDefault();
    try {
      await App.Api.Auth.logout();
    } catch (err) {
      console.warn('Falha no logout (provavelmente já deslogado):', err);
    } finally {
      window.location.href = '/login';
    }
  }

  function bindLogoutButton(btnSelector = '#logoutButton') {
    const btn = Dom.qs(btnSelector);
    if (!btn) return;
    Dom.on(btn, 'click', handleLogout);
  }

  App.Auth = {
    showError,
    clearError,
    bindLoginForm,
    handleLogout,
    bindLogoutButton
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#login-form')) {
      App.Auth.bindLoginForm('#login-form');
    }
    App.Auth.bindLogoutButton('#logoutButton');
  });
})(window);