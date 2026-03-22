'use strict';

// Replace this placeholder with the SHA-256 hex of your actual "username" + "password" string.
// To generate: open browser console on HTTPS, run:
//   const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourusernamepassword'));
//   console.log(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
const EXPECTED_HASH = '72269181990db9da17ac8d076861d09c6c7c12bf36645690a9dc18942e5eaae2';

/* ─── Pure helpers ───────────────────────────────────────────────────────── */

function buildCredentialString(username, password) {
  return username + password;
}

function hexFromBuffer(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function isEmptyCredential(username, password) {
  return username === '' || password === '';
}

/* ─── Core auth functions ────────────────────────────────────────────────── */

async function hashCredentials(username, password) {
  const credentialString = buildCredentialString(username, password);
  const buffer = new TextEncoder().encode(credentialString);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return hexFromBuffer(digest);
}

async function handleSubmit(event) {
  event.preventDefault();

  const username = document.getElementById('auth-username').value;
  const password = document.getElementById('auth-password').value;

  if (isEmptyCredential(username, password)) {
    showError();
    return;
  }

  const hash = await hashCredentials(username, password);
  if (hash === EXPECTED_HASH) {
    await loadApp();
  } else {
    showError();
  }
}

async function loadApp() {
  const authGateHTML = document.body.innerHTML;

  try {
    const response = await fetch('app.html');
    const text = await response.text();
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(text, 'text/html');
    const appContent = parsedDoc.body.innerHTML;

    document.body.innerHTML = appContent;

    const script = document.createElement('script');
    script.src = 'calc.js?v=' + Date.now();
    script.onerror = () => {
      document.body.innerHTML = authGateHTML;
      showError();
    };
    document.body.appendChild(script);
  } catch (e) {
    document.body.innerHTML = authGateHTML;
    showError();
  }
}

function showError() {
  const el = document.getElementById('auth-error');
  el.textContent = 'Invalid credentials';
  el.classList.add('auth-error--visible');
}

function hideError() {
  const el = document.getElementById('auth-error');
  el.classList.remove('auth-error--visible');
}

/* ─── Initialisation ─────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    const el = document.getElementById('auth-error');
    if (el) {
      el.textContent = 'Requires HTTPS';
      el.classList.add('auth-error--visible');
    }
    return;
  }

  const usernameInput = document.getElementById('auth-username');
  const passwordInput = document.getElementById('auth-password');
  const form = document.getElementById('auth-form');

  usernameInput.focus();

  const pwToggle = document.getElementById('auth-pw-toggle');
  pwToggle.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    pwToggle.textContent = isHidden ? '✕' : '···';
    pwToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  usernameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSubmit(e);
  });

  passwordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSubmit(e);
  });

  usernameInput.addEventListener('input', () => hideError());
  passwordInput.addEventListener('input', () => hideError());

  form.addEventListener('submit', handleSubmit);
});
