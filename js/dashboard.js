/* ============================= MODERN DASHBOARD ============================= */

function renderDashboard() {
  saveState();
  const seriesCourses = coursesInActiveSeries();
  const seriesClasses = classesInActiveSeries();
  const seriesStudents = studentsInActiveSeries();
  const activeS = activeSeries();

  const totalWeeklyHours = seriesClasses.reduce((acc, c) => acc + (c.span * 50 / 60), 0).toFixed(1);
  const theoryClasses = seriesClasses.filter(c => c.cat !== 'Lab').length;
  const labClasses = seriesClasses.filter(c => c.cat === 'Lab').length;

  const stats = [
    {
      num: seriesClasses.length,
      lbl: "Weekly Sessions",
      sub: `${theoryClasses} Theory • ${labClasses} Labs (${totalWeeklyHours} hrs)`,
      ic: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      bg: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
      fg: "#4338ca"
    },
    {
      num: state.teachers.length,
      lbl: "Faculty Members",
      sub: "Active academic department staff",
      ic: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      bg: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
      fg: "#0369a1"
    },
    {
      num: seriesCourses.length,
      lbl: "Enrolled Courses",
      sub: `${seriesCourses.filter(c => c.type === 'lab').length} Sessional • ${seriesCourses.filter(c => c.type === 'theory').length} Theory`,
      ic: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`,
      bg: "linear-gradient(135deg, #fef3c7, #fde68a)",
      fg: "#b45309"
    },
    {
      num: seriesStudents.length,
      lbl: "Active Students",
      sub: `${activeS ? activeS.name : 'All batches'} enrollment`,
      ic: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      bg: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
      fg: "#15803d"
    }
  ];

  const perDay = DAYS.map(d => ({ day: d, count: classesForDay(d).length }));
  const maxCount = Math.max(1, ...perDay.map(p => p.count));
  const unassigned = seriesCourses.filter(c => c.type === 'theory' ? !c.teacherId : computeLabGroups(c).some(g => !g.teacherId || !g.labId));

  document.getElementById('mainArea').innerHTML = `
    <div class="topbar">
      <div class="page-title-group">
        <div class="page-breadcrumbs">Department of ECE &rsaquo; Administrative Overview</div>
        <div class="page-title-row">
          <h1 class="page-title">Executive Dashboard</h1>
          ${state.isAdmin ? '<span class="tag admin-on">🔓 Admin Authenticated</span>' : '<span class="tag read-only">🔒 Read-Only Visitor</span>'}
        </div>
      </div>
      <div class="top-spacer"></div>
      <button class="btn-primary" id="dashGoRoutineBtn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Open Weekly Routine</span>
      </button>
    </div>

    <div class="series-row" id="seriesRow"></div>

    <div class="stat-grid">
      ${stats.map(s => `
        <div class="stat-card dashboard-stat-card">
          <div class="stat-card-header">
            <div class="stat-icon-squarcle" style="background:${s.bg};color:${s.fg};">${s.ic}</div>
            <span class="stat-pill-label">Metric</span>
          </div>
          <div class="num dashboard-num">${s.num}</div>
          <div class="lbl dashboard-lbl">${s.lbl}</div>
          <div class="sub-stat-text">${s.sub}</div>
        </div>
      `).join('')}
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header-row">
          <div>
            <h3 style="margin:0;font-size:16px;">Classes Scheduled per Day</h3>
            <div style="font-size:12px;color:var(--text-mute);margin-top:2px;">Weekly class volume distribution for ${activeS ? activeS.name : 'current series'}</div>
          </div>
          <span class="tag" style="background:var(--violet-soft);color:var(--violet-dark);font-weight:700;">5 Active Weekdays</span>
        </div>

        <div class="dash-chart-container">
          ${perDay.map(p => {
    const pct = Math.round((p.count / maxCount) * 100);
    const barHeight = Math.max(12, Math.round((p.count / maxCount) * 140));
    return `
              <div class="dash-bar-col" title="${p.day}: ${p.count} classes">
                <div class="dash-bar-val">${p.count}</div>
                <div class="dash-bar-track">
                  <div class="dash-bar-fill" style="height:${barHeight}px;"></div>
                </div>
                <div class="dash-bar-day">${p.day.slice(0, 3)}</div>
              </div>`;
  }).join('')}
        </div>
      </div>

      <div class="side-card" style="margin-bottom:0;">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Staffing Status</span>
        </h3>
        <p style="font-size:12px;color:var(--text-mute);margin-top:0;margin-bottom:12px;">Courses requiring teacher allocation before routine auto-generation.</p>
        
        <div class="unassigned-list-box">
          ${unassigned.length ? unassigned.map(c => `
            <div class="side-row unassigned-item">
              <div class="unassigned-code">${c.code}</div>
              <div class="unassigned-title">${c.title}</div>
              ${state.isAdmin ? `<button class="quick-assign-btn" data-assigncourse="${c.id}">Assign</button>` : ''}
            </div>
          `).join('') : `
            <div class="all-assigned-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <div>All active courses fully assigned!</div>
            </div>`}
        </div>

        <a class="view-all" data-nav="courses" style="cursor:pointer;margin-top:14px;">
          Manage Course Allocations &rarr;
        </a>
      </div>
    </div>
  `;

  renderSeriesTabs('seriesRow', renderDashboard);

  document.getElementById('dashGoRoutineBtn').onclick = () => {
    state.activeNav = 'routine';
    renderAll();
  };

  document.querySelectorAll('[data-nav="courses"]').forEach(a => a.onclick = (e) => {
    e.preventDefault();
    state.activeNav = 'courses';
    renderAll();
  });

  document.querySelectorAll('[data-assigncourse]').forEach(b => b.onclick = requireAdmin(() => {
    openQuickTeacherModal(Number(b.dataset.assigncourse));
  }));
}
