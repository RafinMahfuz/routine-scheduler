const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('TESTING CORPORATE ADMIN LOGIN & SESSION ACCESS');
console.log('====================================================\n');

// Mock DOM
let sessionStore = {};
const mockSessionStorage = {
  getItem: (k) => sessionStore[k] || null,
  setItem: (k, v) => { sessionStore[k] = String(v); },
  removeItem: (k) => { delete sessionStore[k]; },
  clear: () => { sessionStore = {}; }
};

function createEl(tag, id = '') {
  const classes = new Set();
  return {
    tagName: tag.toUpperCase(),
    id,
    value: '',
    type: 'text',
    style: {},
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      contains: (c) => classes.has(c),
      toggle: (c, v) => { if (v) classes.add(c); else classes.delete(c); }
    },
    addEventListener: () => { },
    focus: () => { },
    select: () => { }
  };
}

const portalEl = createEl('div', 'adminLoginPortal');
const cardEl = createEl('div');
cardEl.classList.add('corp-login-card');
const passInputEl = createEl('input', 'corpAdminPass');
passInputEl.type = 'password';
const userEl = createEl('input', 'corpAdminUser');
userEl.value = 'admin';
const toggleBtnEl = createEl('button', 'corpTogglePassBtn');
const defaultFillBtnEl = createEl('button', 'corpFillDefaultBtn');
const submitBtnEl = createEl('button', 'corpLoginSubmitBtn');
const formEl = createEl('form', 'adminLoginForm');
const errEl = createEl('div', 'corpLoginError');

const elements = {
  adminLoginPortal: portalEl,
  corpAdminPass: passInputEl,
  corpAdminUser: userEl,
  corpTogglePassBtn: toggleBtnEl,
  corpFillDefaultBtn: defaultFillBtnEl,
  corpLoginSubmitBtn: submitBtnEl,
  adminLoginForm: formEl,
  corpLoginError: errEl
};

const bodyEl = {
  classList: {
    _classes: new Set(),
    add: function (...c) { c.forEach(x => this._classes.add(x)); },
    remove: function (...c) { c.forEach(x => this._classes.delete(x)); },
    contains: function (c) { return this._classes.has(c); }
  }
};

const context = {
  console,
  setTimeout: (fn) => fn(),
  sessionStorage: mockSessionStorage,
  window: {},
  document: {
    body: bodyEl,
    getElementById: (id) => elements[id] || null,
    querySelector: (sel) => {
      if (sel === '.corp-login-card') return cardEl;
      return null;
    }
  },
  toast: (msg, kind) => {
    // console.log(`  [Toast] (${kind}): ${msg}`);
  },
  renderAll: () => {
    // console.log('  [renderAll] called');
  }
};

vm.createContext(context);

// Load data.js and admin.js
const dataCode = fs.readFileSync('js/data.js', 'utf8');
const adminCode = fs.readFileSync('js/admin.js', 'utf8');

vm.runInContext(dataCode, context);
vm.runInContext(adminCode, context);
vm.runInContext('this.state = state; this.initAdminAccess = initAdminAccess; this.attemptAdminLogin = attemptAdminLogin; this.requireAdmin = requireAdmin; this.adminLogout = adminLogout;', context);

// TEST 1: Initial state without active session
console.log('--- TEST 1: Initial unauthenticated state ---');
context.initAdminAccess();
if (!context.state.isAdmin) {
  console.log('✓ PASS: state.isAdmin is false before login');
} else {
  console.error('✗ FAIL: state.isAdmin should be false before login');
  process.exit(1);
}
if (!portalEl.classList.contains('portal-hidden')) {
  console.log('✓ PASS: Login portal is displayed and visible');
} else {
  console.error('✗ FAIL: Login portal should not have portal-hidden');
  process.exit(1);
}
if (bodyEl.classList.contains('auth-locked')) {
  console.log('✓ PASS: Body has auth-locked class');
} else {
  console.error('✗ FAIL: Body should have auth-locked class');
  process.exit(1);
}

// TEST 2: Attempting login with incorrect password
console.log('\n--- TEST 2: Invalid password handling ---');
passInputEl.value = 'wrongPassword123';
const failRes = context.attemptAdminLogin('wrongPassword123');
if (failRes === false && !context.state.isAdmin) {
  console.log('✓ PASS: Invalid login rejected, state.isAdmin remains false');
} else {
  console.error('✗ FAIL: Invalid login should have been rejected');
  process.exit(1);
}
if (errEl.style.display !== 'none' && errEl.textContent.includes('Invalid')) {
  console.log('✓ PASS: Clear corporate error message displayed');
} else {
  console.error('✗ FAIL: Error message was not shown');
  process.exit(1);
}

// TEST 3: Successful admin login
console.log('\n--- TEST 3: Successful admin login & session grant ---');
passInputEl.value = 'admin123';
const successRes = context.attemptAdminLogin('admin123');
if (successRes === true && context.state.isAdmin === true) {
  console.log('✓ PASS: Valid login approved, state.isAdmin set to true');
} else {
  console.error('✗ FAIL: Valid login should have succeeded');
  process.exit(1);
}
if (mockSessionStorage.getItem('ruet_ece_admin_session') === 'active') {
  console.log('✓ PASS: ruet_ece_admin_session saved to sessionStorage');
} else {
  console.error('✗ FAIL: sessionStorage did not store active session');
  process.exit(1);
}
if (portalEl.classList.contains('portal-hidden')) {
  console.log('✓ PASS: Login portal hidden with portal-hidden class');
} else {
  console.error('✗ FAIL: Portal should be hidden after login');
  process.exit(1);
}
if (!bodyEl.classList.contains('auth-locked')) {
  console.log('✓ PASS: Body auth-locked removed');
} else {
  console.error('✗ FAIL: auth-locked should be removed from body');
  process.exit(1);
}

// TEST 4: requireAdmin operates with zero prompts during active session
console.log('\n--- TEST 4: requireAdmin full control without repeated login ---');
let actionExecuted = false;
const privilegedAction = context.requireAdmin(() => { actionExecuted = true; });
privilegedAction();
if (actionExecuted === true) {
  console.log('✓ PASS: Privileged action executed seamlessly with zero login prompts');
} else {
  console.error('✗ FAIL: Privileged action failed to execute');
  process.exit(1);
}

// TEST 5: Session persistence across page reloads in the same tab
console.log('\n--- TEST 5: Tab session persistence across reloads ---');
// Re-initialize as if user refreshed the tab
context.state.isAdmin = false;
context.initAdminAccess();
if (context.state.isAdmin === true && portalEl.classList.contains('portal-hidden')) {
  console.log('✓ PASS: Active tab session maintained, user remains logged in without re-typing password');
} else {
  console.error('✗ FAIL: Session was not maintained from sessionStorage');
  process.exit(1);
}

// TEST 6: Explicit admin logout
console.log('\n--- TEST 6: Explicit admin logout ---');
context.adminLogout();
if (context.state.isAdmin === false && !portalEl.classList.contains('portal-hidden')) {
  console.log('✓ PASS: Logout clears session and immediately locks portal');
} else {
  console.error('✗ FAIL: Logout did not reset admin state or show portal');
  process.exit(1);
}
if (!mockSessionStorage.getItem('ruet_ece_admin_session')) {
  console.log('✓ PASS: sessionStorage session key removed');
} else {
  console.error('✗ FAIL: Session key was not removed from sessionStorage');
  process.exit(1);
}

// TEST 7: Password change in Settings works with new password
console.log('\n--- TEST 7: Dynamic password update integration ---');
context.state.adminPassword = 'CustomSecureKey2026!';
const oldPassTry = context.attemptAdminLogin('admin123');
if (oldPassTry === false) {
  console.log('✓ PASS: Old password rejected after update');
} else {
  console.error('✗ FAIL: Old password should be rejected');
  process.exit(1);
}
const newPassTry = context.attemptAdminLogin('CustomSecureKey2026!');
if (newPassTry === true && context.state.isAdmin === true) {
  console.log('✓ PASS: New updated password grants admin access successfully');
} else {
  console.error('✗ FAIL: New password failed to grant access');
  process.exit(1);
}

console.log('\n====================================================');
console.log('ALL CORPORATE ADMIN LOGIN TESTS PASSED 100%!');
console.log('====================================================');
