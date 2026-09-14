/* ============================= BOOTSTRAP ============================= */
/* Try to restore previously-saved data first; only seed the demo data on a
   genuine first run (nothing in localStorage yet). */
if (!loadState()) {
  seedData();
}

function applySidebarState() {
  document.body.classList.toggle('sidebar-hidden', !!state.sidebarHidden || !!state.focusMode);
  document.body.classList.toggle('focus-mode', !!state.focusMode);
}

if (state.darkMode) document.body.classList.add('dark');
applySidebarState();
renderAll();
if (typeof initAdminAccess === 'function') {
  initAdminAccess();
}
if (typeof loadFromCloud === 'function') {
  loadFromCloud(renderAll);
}

function toggleSidebar() {
  state.sidebarHidden = !state.sidebarHidden;
  if (state.focusMode) state.focusMode = false;
  applySidebarState();
  saveState();
}
document.getElementById('sidebarShowBtn').onclick = toggleSidebar;
document.getElementById('sidebarCollapseBtn').onclick = toggleSidebar;

// Guarantee floating menu button is completely stripped from all prints & PDF outputs
window.addEventListener('beforeprint', () => {
  const sidebarBtn = document.getElementById('sidebarShowBtn');
  if (sidebarBtn) sidebarBtn.style.setProperty('display', 'none', 'important');
});
window.addEventListener('afterprint', () => {
  const sidebarBtn = document.getElementById('sidebarShowBtn');
  if (sidebarBtn) sidebarBtn.style.removeProperty('display');
});


