/* ============================= MODERN NAV & TABS ============================= */
const NAV_ICONS = {
  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  routine: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>`,
  rooms: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><circle cx="15" cy="12" r="1"/></svg>`,
  labs: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.62 17.6A2 2 0 0 0 6.28 20.6h11.44a2 2 0 0 0 1.66-3L14 9.31V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
  teachers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  courses: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`,
  students: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  reports: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "routine", label: "Routine" },
  { key: "rooms", label: "Rooms" },
  { key: "labs", label: "Labs" },
  { key: "teachers", label: "Teachers" },
  { key: "courses", label: "Courses" },
  { key: "students", label: "Students" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

function renderNav() {
  const el = document.getElementById('navList');
  if (!el) return;

  const navHtml = NAV_ITEMS.map(n => {
    const isActive = state.activeNav === n.key;
    const icon = NAV_ICONS[n.key] || '';
    let badge = '';
    if (n.key === 'teachers') badge = `<span class="nav-count-badge">${state.teachers.length}</span>`;
    else if (n.key === 'courses') badge = `<span class="nav-count-badge">${coursesInActiveSeries().length}</span>`;
    else if (n.key === 'labs') badge = `<span class="nav-count-badge">${state.labs.length}</span>`;

    return `
      <div class="nav-item ${isActive ? 'active' : ''}" data-nav="${n.key}">
        <span class="nav-ic">${icon}</span>
        <span class="nav-label">${n.label}</span>
        ${badge}
      </div>`;
  }).join('');

  const adminIcon = state.isAdmin
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

  const adminStatusTag = state.isAdmin
    ? `<span class="admin-live-tag unlocked">Admin ON</span>`
    : `<span class="admin-live-tag locked">Read Only</span>`;

  el.innerHTML = navHtml + `
    <div class="nav-divider"></div>
    <div class="nav-item nav-admin-item ${state.isAdmin ? 'admin-active' : ''}" id="adminNavBtn">
      <span class="nav-ic">${adminIcon}</span>
      <span class="nav-label">${state.isAdmin ? 'Admin Mode' : 'Admin Access'}</span>
      ${adminStatusTag}
    </div>`;

  el.querySelectorAll('[data-nav]').forEach(n => {
    n.onclick = () => { state.activeNav = n.dataset.nav; renderAll(); };
  });

  const adminBtn = document.getElementById('adminNavBtn');
  if (adminBtn) {
    adminBtn.onclick = () => {
      if (state.isAdmin) {
        if (confirm('Switch back to standard read-only view?')) adminLogout();
      } else {
        openAdminLogin(renderAll);
      }
    };
  }
}

/* Reusable Series Tab Bar */
function renderSeriesTabs(containerId, onSwitchRerender, opts) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const showAll = opts && opts.allSeries;

  const allPill = showAll
    ? `<button class="series-pill all-pill ${state.routineAllSeries ? 'active' : ''}" data-series="ALL">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>All Batches</span>
       </button>`
    : '';

  const pills = state.series.map(s => {
    const isActive = (!state.routineAllSeries || !showAll) && s.id === state.activeSeriesId;
    return `
      <button class="series-pill ${isActive ? 'active' : ''}" data-series="${s.id}">
        <span>${s.name}</span>
      </button>`;
  }).join('');

  const addBtn = `<button class="series-add-btn" id="addSeriesTabBtn" title="Create New Batch/Series">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    <span>New Series</span>
  </button>`;

  el.innerHTML = `<div class="series-pills-rail">${allPill}${pills}${addBtn}</div>`;

  el.querySelectorAll('[data-series]').forEach(b => b.onclick = () => {
    if (b.dataset.series === 'ALL') {
      state.routineAllSeries = true;
      onSwitchRerender();
      return;
    }
    state.routineAllSeries = false;
    state.activeSeriesId = Number(b.dataset.series);
    onSwitchRerender();
  });

  const addSeriesBtn = document.getElementById('addSeriesTabBtn');
  if (addSeriesBtn) {
    addSeriesBtn.onclick = requireAdmin(() => {
      simpleFormModal({
        title: "Add Academic Series / Batch",
        sub: "Create a new batch, e.g. \"26 Series\" or \"Postgraduate M.Sc\".",
        fields: [
          { key: 'name', label: 'Series Name', placeholder: 'e.g. 26 Series' },
          { key: 'label', label: 'Sheet Row Label (optional)', placeholder: 'e.g. 1st Year Odd|Semester 2026 Series' }
        ],
        onSave: (d) => {
          const s = { id: nextId(), name: d.name, label: d.label || '' };
          state.series.push(s);
          state.activeSeriesId = s.id;
          state.routineAllSeries = false;
          onSwitchRerender();
          toast(`Series "${s.name}" added successfully`, 'ok');
        }
      });
    });
  }
}

/* Day Filter Bar */
function renderDayFilter(containerId, onSwitchRerender) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const opts = ["All", ...DAYS];

  el.innerHTML = `
    <div class="day-filter-rail">
      <span class="day-filter-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Filter Day:
      </span>
      ${opts.map(d => {
    const isActive = state.routineDayFilter === d;
    return `<button class="day-pill ${isActive ? 'active' : ''}" data-day="${d}">
          <span>${d === 'All' ? 'Whole Week' : d}</span>
        </button>`;
  }).join('')}
    </div>`;

  el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => {
    state.routineDayFilter = b.dataset.day;
    onSwitchRerender();
  });
}

/* ============================= ROUTER ============================= */
function renderAll() {
  renderNav();
  switch (state.activeNav) {
    case 'dashboard': renderDashboard(); break;
    case 'routine': renderRoutine(); break;
    case 'rooms': renderRooms(); break;
    case 'labs': renderLabs(); break;
    case 'teachers': renderTeachers(); break;
    case 'courses': renderCourses(); break;
    case 'students': renderStudents(); break;
    case 'reports': renderReports(); break;
    case 'settings': renderSettings(); break;
    default: renderRoutine();
  }
}
