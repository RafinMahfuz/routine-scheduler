/* ============================= CORPORATE ADMIN AUTHENTICATION & ACCESS CONTROL ============================= */
const ADMIN_SESSION_KEY = 'ruet_ece_admin_session';

/**
 * Checks if active admin session exists in this browser tab.
 * In headless/Node test environments without window/sessionStorage, defaults to true.
 */
function checkAdminSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'active';
    }
  } catch (e) { }
  return typeof window === 'undefined';
}

/**
 * Persists or clears the admin session in sessionStorage for this tab.
 */
function setAdminSession(active) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (active) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'active');
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
  } catch (e) { }
  state.isAdmin = !!active;
}

/**
 * Gatekeeper for privileged operations. Since logging in grants full control,
 * this executes immediately if logged in, or prompts the corporate login portal.
 */
function requireAdmin(action) {
  return function (...args) {
    if (state.isAdmin) {
      action(...args);
      return;
    }
    showLoginPortal();
  };
}

/**
 * Displays the full corporate admin login portal.
 */
function showLoginPortal() {
  const portal = document.getElementById('adminLoginPortal');
  if (!portal) return;
  portal.classList.remove('portal-hidden');
  document.body.classList.add('auth-locked');
  const passInput = document.getElementById('corpAdminPass');
  if (passInput) {
    passInput.value = '';
    setTimeout(() => passInput.focus(), 80);
  }
  const errEl = document.getElementById('corpLoginError');
  if (errEl) errEl.style.display = 'none';
}

/**
 * Hides the corporate login portal and restores standard application view.
 */
function hideLoginPortal() {
  const portal = document.getElementById('adminLoginPortal');
  if (!portal) return;
  portal.classList.add('portal-hidden');
  document.body.classList.remove('auth-locked');
}

/**
 * Validates administrative credentials. Grants complete system control upon success.
 */
async function attemptAdminLogin(inputPassword) {
  const entered = (inputPassword !== undefined ? inputPassword : (document.getElementById('corpAdminPass') ? document.getElementById('corpAdminPass').value : '')).trim();
  const errEl = document.getElementById('corpLoginError');
  const card = document.querySelector('.corp-login-card');
  const submitBtn = document.getElementById('corpLoginSubmitBtn');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying credentials...</span>';
  }

  let isAuthorized = false;

  // 1. Verify against Vercel backend /api/routine (Single Source of Truth)
  try {
    const res = await fetch('/api/routine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${entered}`
      },
      body: JSON.stringify({ action: 'verify' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) {
        isAuthorized = true;
      }
    } else if (res.status === 401) {
      isAuthorized = false;
    } else {
      // Offline fallback
      const currentPassword = (state.adminPassword || 'admin123').trim();
      isAuthorized = (entered === currentPassword);
    }
  } catch (e) {
    // Offline / local fallback
    const currentPassword = (state.adminPassword || 'admin123').trim();
    isAuthorized = (entered === currentPassword);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="corp-btn-text">Authorize &amp; Enter Workspace</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>';
    }
  }

  if (isAuthorized) {
    state.adminPassword = entered;
    try { sessionStorage.setItem('ruet_ece_admin_pass', entered); } catch (e) { }
    setAdminSession(true);
    hideLoginPortal();
    if (typeof renderAll === 'function') renderAll();
    if (typeof toast === 'function') toast('Administrative access granted. Full control active for this session.', 'ok');
    return true;
  } else {
    if (errEl) {
      errEl.textContent = 'Invalid security access key. Please verify credentials.';
      errEl.style.display = 'block';
    }
    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth; // trigger reflow
      card.classList.add('shake');
    }
    const passInput = document.getElementById('corpAdminPass');
    if (passInput) {
      passInput.focus();
      passInput.select();
    }
    if (typeof toast === 'function') toast('Incorrect password. Access denied.', 'error');
    return false;
  }
}

/**
 * Logs out the administrator, clears session, and locks the application.
 */
function adminLogout() {
  setAdminSession(false);
  showLoginPortal();
  if (typeof renderAll === 'function') renderAll();
  if (typeof toast === 'function') toast('Administrator signed out. Portal locked.', 'info');
}

/**
 * Initializes the corporate login portal events and checks session on startup.
 */
function initAdminAccess() {
  const portal = document.getElementById('adminLoginPortal');
  if (!portal) return;

  const passInput = document.getElementById('corpAdminPass');
  const toggleBtn = document.getElementById('corpTogglePassBtn');
  const defaultFillBtn = document.getElementById('corpFillDefaultBtn');
  const form = document.getElementById('adminLoginForm');
  const submitBtn = document.getElementById('corpLoginSubmitBtn');

  // Toggle password visibility
  if (toggleBtn && passInput) {
    toggleBtn.onclick = () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      const eyeOpen = toggleBtn.querySelector('.eye-open');
      const eyeClosed = toggleBtn.querySelector('.eye-closed');
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPass ? 'none' : 'block';
        eyeClosed.style.display = isPass ? 'block' : 'none';
      }
    };
  }

  // Quick preset button to fill default password
  if (defaultFillBtn && passInput) {
    defaultFillBtn.onclick = () => {
      passInput.value = state.adminPassword || 'admin123';
      passInput.focus();
    };
  }

  // Submit on button or form submit
  if (submitBtn) {
    submitBtn.onclick = (e) => {
      e.preventDefault();
      attemptAdminLogin();
    };
  }
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      attemptAdminLogin();
      return false;
    };
  }
  if (passInput) {
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attemptAdminLogin();
      }
    });
  }

  // Check existing session in sessionStorage
  if (checkAdminSession()) {
    state.isAdmin = true;
    hideLoginPortal();
  } else {
    state.isAdmin = false;
    showLoginPortal();
  }
}

// Fallback in-app modal or direct portal trigger
function openAdminLogin(onSuccess) {
  if (state.isAdmin) {
    if (onSuccess) onSuccess();
    return;
  }
  showLoginPortal();
}
