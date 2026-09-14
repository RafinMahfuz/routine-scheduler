/* ============================= ENHANCED MODAL & TOAST SYSTEM ============================= */

function openModal(html, onMount) {
  const modalEl = document.getElementById('modalBody');
  const overlayEl = document.getElementById('overlay');
  if (!modalEl || !overlayEl) return;

  modalEl.innerHTML = html;
  overlayEl.classList.add('show');
  document.body.classList.add('modal-open');

  // Focus first input if available
  setTimeout(() => {
    const firstInput = modalEl.querySelector('input, select, textarea, button.btn-primary');
    if (firstInput) firstInput.focus();
  }, 60);

  if (onMount) onMount();
}

function closeModal() {
  const overlayEl = document.getElementById('overlay');
  if (!overlayEl) return;
  overlayEl.classList.remove('show');
  document.body.classList.remove('modal-open');
}

// Close on clicking backdrop
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target.id === 'overlay') closeModal();
});

// Close on Escape key
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('overlay');
    if (overlay && overlay.classList.contains('show')) {
      closeModal();
    }
  }
});

/* ---- Toast notifications ---- */
function toast(message, kind = 'info', ms = 2800) {
  let host = document.getElementById('toastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastHost';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }

  const icons = {
    ok: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    warn: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML = `
    <div class="toast-ic">${icons[kind] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" title="Dismiss">✕</button>
    <div class="toast-progress" style="animation-duration: ${ms}ms;"></div>
  `;

  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  const remove = () => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 260);
  };

  const timer = setTimeout(remove, ms);
  el.querySelector('.toast-close').addEventListener('click', (e) => {
    e.stopPropagation();
    clearTimeout(timer);
    remove();
  });
}

/* Reusable form modal with validation and keyboard enter support */
function simpleFormModal({ title, sub, fields, initial, onSave, onDelete }) {
  const fieldsHtml = fields.map(f => {
    const val = initial ? (initial[f.key] ?? '') : '';
    if (f.type === 'select') {
      return `
        <div class="field">
          <label for="mf-${f.key}">${f.label}</label>
          <select id="mf-${f.key}">
            ${f.options.map(o => `<option ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>`;
    }
    return `
      <div class="field">
        <label for="mf-${f.key}">${f.label}</label>
        <input id="mf-${f.key}" type="${f.type || 'text'}" value="${val}" placeholder="${f.placeholder || ''}">
      </div>`;
  }).join('');

  openModal(`
    <div class="modal-header">
      <h2>${title}</h2>
      <div class="sub">${sub}</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-form-body">
      ${fieldsHtml}
    </div>
    <div class="modal-actions">
      ${onDelete ? `<button class="btn-ghost btn-danger" id="mDel">Delete</button><div style="flex:1;"></div>` : ''}
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="mSave">Save Changes</button>
    </div>
  `);

  const saveAction = () => {
    const data = {};
    for (const f of fields) {
      const el = document.getElementById('mf-' + f.key);
      data[f.key] = el ? el.value.trim() : '';
    }
    if (fields[0] && !data[fields[0].key]) {
      toast(`${fields[0].label} is required`, 'warn');
      const firstEl = document.getElementById('mf-' + fields[0].key);
      if (firstEl) firstEl.focus();
      return;
    }
    onSave(data);
    closeModal();
  };

  document.getElementById('mSave').onclick = saveAction;

  // Submit on Enter
  const inputs = document.querySelectorAll('#modalBody input');
  inputs.forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveAction();
      }
    });
  });

  if (onDelete) {
    document.getElementById('mDel').onclick = () => {
      onDelete();
      closeModal();
    };
  }
}
