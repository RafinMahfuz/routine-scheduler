/* ============================= MODERN ANALYTICS & REPORTS ============================= */

function renderReports() {
  saveState();
  const seriesClasses = classesInActiveSeries();
  const catCounts = CATS.map(c => ({ cat: c, count: seriesClasses.filter(x => x.cat === c).length })).filter(x => x.count > 0);
  const maxCatCount = Math.max(1, ...catCounts.map(c => c.count));

  const roomUsage = {};
  seriesClasses.forEach(c => { if (c.room) { roomUsage[c.room] = (roomUsage[c.room] || 0) + c.span; } });
  const roomRows = Object.entries(roomUsage).sort((a, b) => b[1] - a[1]);
  const maxRoomHours = Math.max(1, ...roomRows.map(r => r[1]));

  const teacherLoad = state.teachers.map(t => ({
    name: t.name,
    shortName: teacherShort(t),
    color: t.color,
    count: seriesClasses.filter(c => c.teacherId === t.id).length,
    hours: (seriesClasses.filter(c => c.teacherId === t.id).reduce((acc, c) => acc + c.span, 0) * 50 / 60).toFixed(1)
  })).sort((a, b) => b.count - a.count);

  document.getElementById('mainArea').innerHTML = `
    <div class="topbar">
      <div class="page-title-group">
        <div class="page-breadcrumbs">Department of ECE &rsaquo; Analytical Insights</div>
        <div class="page-title-row">
          <h1 class="page-title">Operational Reports</h1>
          <span class="count-pill-badge">${seriesClasses.length} total sessions scheduled</span>
        </div>
      </div>
      <div class="top-spacer"></div>
      <button class="btn-primary" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <span>Print Summary Report</span>
      </button>
    </div>

    <div class="series-row" id="seriesRow"></div>

    <div class="content-grid">
      <div class="card">
        <h3 style="margin-top:0;display:flex;align-items:center;gap:8px;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
          <span>Sessions by Department Discipline</span>
        </h3>
        <p style="font-size:12px;color:var(--text-mute);margin:0 0 14px 0;">Distribution of weekly courses across engineering and fundamental sciences.</p>

        <table class="data-table">
          <thead><tr><th>Discipline</th><th>Weekly Sessions</th><th>Volume Share</th></tr></thead>
          <tbody>
            ${catCounts.map(c => `
              <tr>
                <td><span class="tag" style="background:var(--c-${c.cat.toLowerCase()}-bg,#eef2ff);color:var(--c-${c.cat.toLowerCase()}-fg,#4338ca);font-weight:700;">${c.cat}</span></td>
                <td><strong>${c.count}</strong> session(s)</td>
                <td style="width:140px;">
                  <div class="meter-bar-track">
                    <div class="meter-bar-fill" style="width:${Math.round((c.count / maxCatCount) * 100)}%;"></div>
                  </div>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="3"><div class="empty-state">No scheduled sessions in scope.</div></td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 style="margin-top:0;display:flex;align-items:center;gap:8px;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Faculty Contact Hours</span>
        </h3>
        <p style="font-size:12px;color:var(--text-mute);margin:0 0 14px 0;">Weekly classroom and lab instructional workload per teacher.</p>

        <div style="max-height:360px;overflow-y:auto;">
          <table class="data-table">
            <thead><tr><th>Faculty</th><th>Sessions</th><th>Contact Hours</th></tr></thead>
            <tbody>
              ${teacherLoad.map(t => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span class="swatch" style="background:${t.color.fg};"></span>
                      <strong>${t.shortName}</strong>
                      <span style="font-size:11.5px;color:var(--text-mute);">${t.name}</span>
                    </div>
                  </td>
                  <td><strong>${t.count}</strong></td>
                  <td><span class="tag" style="background:#f1f5f9;color:#334155;font-weight:700;">${t.hours} hrs</span></td>
                </tr>
              `).join('') || '<tr><td colspan="3"><div class="empty-state">No teacher assignments.</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="margin-top:0;display:flex;align-items:center;gap:8px;">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
        <span>Classroom &amp; Lab Space Utilization</span>
      </h3>
      <p style="font-size:12px;color:var(--text-mute);margin:0 0 14px 0;">Aggregate hours occupied across lecture classrooms and sessional laboratories.</p>

      <table class="data-table">
        <thead><tr><th>Facility / Room</th><th>Total Periods Occupied</th><th>Relative Load</th></tr></thead>
        <tbody>
          ${roomRows.map(([room, count]) => `
            <tr>
              <td><strong>${room}</strong></td>
              <td>${count} period(s) (${(count * 50 / 60).toFixed(1)} hrs)</td>
              <td style="width:200px;">
                <div class="meter-bar-track">
                  <div class="meter-bar-fill" style="width:${Math.round((count / maxRoomHours) * 100)}%;background:linear-gradient(90deg,#6366f1,#8b5cf6);"></div>
                </div>
              </td>
            </tr>
          `).join('') || '<tr><td colspan="3"><div class="empty-state">No room assignments currently recorded.</div></td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  renderSeriesTabs('seriesRow', renderReports);
}
