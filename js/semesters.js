/* ============================= ACADEMIC SEMESTERS & SYLLABUS MANAGEMENT ============================= */

function renderSemesters() {
  saveState();
  if (!state.activeSemester || !SEMESTERS.includes(state.activeSemester)) {
    state.activeSemester = SEMESTERS[0];
  }

  const currentSemester = state.activeSemester;
  const allCoursesForSemester = (state.semesterCourses || []).filter(c => c.semester === currentSemester);

  const theoryCount = allCoursesForSemester.filter(c => c.type === 'theory').length;
  const labCount = allCoursesForSemester.filter(c => c.type === 'lab').length;
  const totalCredits = allCoursesForSemester.reduce((acc, c) => acc + (Number(c.credit) || 0), 0);

  const runningBatches = state.series.filter(s => s.runningSemester === currentSemester);
  const runningBatchesText = runningBatches.length
    ? runningBatches.map(b => `<span class="tag" style="background:var(--primary-soft);color:var(--primary);font-weight:700;">${b.name}</span>`).join(' ')
    : '<span style="color:var(--text-mute);font-size:12px;font-style:italic;">No series currently running</span>';

  let currentFilter = '';

  function renderTableContent() {
    const filtered = currentFilter
      ? allCoursesForSemester.filter(c => {
        const q = currentFilter.toLowerCase();
        return (c.code && c.code.toLowerCase().includes(q)) ||
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.dept && c.dept.toLowerCase().includes(q));
      })
      : allCoursesForSemester;

    const rows = filtered.length ? filtered.map(c => `
      <tr>
        <td><strong style="color:var(--text);font-family:inherit;">${c.code}</strong></td>
        <td>
          <div>
            <strong>${c.title}</strong>
            <div style="font-size:11.5px;color:var(--text-mute);margin-top:1px;">${c.dept} Department • ${c.credit} Credits</div>
          </div>
        </td>
        <td><span class="tag" style="background:var(--slate-soft);color:var(--slate-dark);font-weight:700;">${c.dept}</span></td>
        <td>
          <span class="tag" style="background:${c.type === 'lab' ? 'var(--c-lab-bg)' : 'var(--violet-soft)'};color:${c.type === 'lab' ? 'var(--c-lab-fg)' : 'var(--violet-dark)'};font-weight:700;">
            ${c.type === 'lab' ? '🧪 Sessional Lab' : '📘 Theory Class'}
          </span>
        </td>
        <td><span class="tag" style="background:#f1f5f9;color:#334155;font-weight:700;">${Number(c.credit).toFixed(2)} Cr</span></td>
        <td><span style="font-weight:600;">${c.sessionsPerWeek || (c.type === 'lab' ? 1 : 3)} session(s)/wk</span></td>
        <td style="text-align:right;">
          <div class="row-actions">
            <button class="table-action-btn edit" data-sem-edit="${c.id}" title="Edit Course">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            <button class="table-action-btn delete" data-sem-del="${c.id}" title="Delete Course">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-title">No courses found in ${currentSemester}</div>
            <div class="empty-sub">Click "+ Add Course to Semester" to assign courses.</div>
          </div>
        </td>
      </tr>
    `;

    const tbody = document.getElementById('semTableBody');
    if (tbody) tbody.innerHTML = rows;

    document.querySelectorAll('[data-sem-edit]').forEach(btn => {
      btn.onclick = requireAdmin(() => {
        const id = Number(btn.dataset.semEdit);
        const course = (state.semesterCourses || []).find(x => x.id === id);
        if (course) openSemesterCourseModal(course);
      });
    });

    document.querySelectorAll('[data-sem-del]').forEach(btn => {
      btn.onclick = requireAdmin(() => {
        const id = Number(btn.dataset.semDel);
        const course = (state.semesterCourses || []).find(x => x.id === id);
        if (!course) return;
        if (confirm(`Remove "${course.code} - ${course.title}" from ${currentSemester} syllabus?`)) {
          state.semesterCourses = state.semesterCourses.filter(x => x.id !== id);
          saveState();
          renderSemesters();
          toast(`Course ${course.code} removed from syllabus`, 'info');
        }
      });
    });
  }

  // Generate semester navigation tabs HTML
  const semesterTabsHtml = SEMESTERS.map(sem => {
    const isActive = sem === currentSemester;
    const count = (state.semesterCourses || []).filter(c => c.semester === sem).length;
    return `
      <button class="series-pill ${isActive ? 'active' : ''}" data-sem-tab="${sem}">
        <span>${sem}</span>
        <span class="pill-badge" style="background:${isActive ? 'var(--primary)' : 'rgba(0,0,0,0.06)'};color:${isActive ? '#ffffff' : 'var(--text-mute)'};">${count}</span>
      </button>`;
  }).join('');

  document.getElementById('mainArea').innerHTML = `
    <div class="topbar">
      <div class="page-title-group">
        <div class="page-breadcrumbs">Curriculum &amp; Syllabus &rsaquo; Academic Semesters</div>
        <div class="page-title-row">
          <h1 class="page-title">Academic Semesters &amp; Syllabus</h1>
          <span class="count-pill-badge">${allCoursesForSemester.length} syllabus courses</span>
        </div>
      </div>
      <div class="top-spacer"></div>
      <div class="topbar-actions">
        <div class="table-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="semFilterInput" placeholder="Filter ${currentSemester} courses...">
        </div>
        <button class="btn-primary" id="addSemCourseBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add Course to Semester</span>
        </button>
      </div>
    </div>

    <div class="series-row" style="margin-bottom:14px;">
      <div class="series-pills">${semesterTabsHtml}</div>
    </div>

    <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom:16px;">
      <div class="stat-card">
        <div class="stat-label">Total Credits</div>
        <div class="stat-value" style="color:var(--primary);">${totalCredits.toFixed(2)}</div>
        <div class="stat-sub">Syllabus credit workload</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Theory Classes</div>
        <div class="stat-value" style="color:var(--violet-dark);">${theoryCount}</div>
        <div class="stat-sub">Lecture &amp; core courses</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sessional Labs</div>
        <div class="stat-value" style="color:var(--emerald);">${labCount}</div>
        <div class="stat-sub">Practical lab sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Cohort (Series)</div>
        <div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          ${runningBatchesText}
        </div>
        <div class="stat-sub" style="margin-top:4px;">Currently running batch</div>
      </div>
    </div>

    <div class="card table-card">
      <div class="table-responsive-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:130px;">Course Code</th>
              <th>Course Title</th>
              <th style="width:110px;">Department</th>
              <th style="width:140px;">Category</th>
              <th style="width:110px;">Credits</th>
              <th style="width:130px;">Weekly Load</th>
              <th style="width:140px;text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="semTableBody"></tbody>
        </table>
      </div>
    </div>
  `;

  // Attach tab switch events
  document.querySelectorAll('[data-sem-tab]').forEach(btn => {
    btn.onclick = () => {
      state.activeSemester = btn.dataset.semTab;
      renderSemesters();
    };
  });

  // Filter input handler
  const filterInput = document.getElementById('semFilterInput');
  if (filterInput) {
    filterInput.oninput = () => {
      currentFilter = filterInput.value.trim();
      renderTableContent();
    };
  }

  // Add course to semester button
  const addBtn = document.getElementById('addSemCourseBtn');
  if (addBtn) {
    addBtn.onclick = requireAdmin(() => openSemesterCourseModal(null));
  }

  renderTableContent();
}

/* Modal to add or edit a course inside a semester's syllabus */
function openSemesterCourseModal(course) {
  const isEdit = !!course;
  const currentSemester = state.activeSemester || SEMESTERS[0];
  const c = course || {
    semester: currentSemester,
    code: '',
    title: '',
    credit: 3.0,
    dept: 'ECE',
    type: 'theory',
    sessionsPerWeek: 3
  };

  const body = `
    <div class="modal-header">
      <h2>${isEdit ? 'Edit Syllabus Course' : 'Add Course to ' + currentSemester}</h2>
      <div class="sub">Specify syllabus course parameters, credit weight, and contact structure for <strong>${currentSemester}</strong>.</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-form-body">
      <div class="field-row">
        <div class="field"><label>Course Code</label><input id="sc-code" value="${c.code}" placeholder="e.g. ECE 2103"></div>
        <div class="field"><label>Course Title</label><input id="sc-title" value="${c.title}" placeholder="e.g. Data Structure &amp; Algorithms"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Department</label>
          <select id="sc-dept">
            ${DEPTS.map(d => `<option ${c.dept === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Credits</label><input id="sc-credit" type="number" step="0.25" value="${c.credit}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Course Category</label>
          <select id="sc-type">
            <option value="theory" ${c.type === 'theory' ? 'selected' : ''}>📘 Theory Class (50 min periods, 8:00–1:20)</option>
            <option value="lab" ${c.type === 'lab' ? 'selected' : ''}>🧪 Sessional Lab (3 periods continuous)</option>
          </select>
        </div>
        <div class="field"><label>Weekly Load (Sessions/wk)</label><input id="sc-sessions" type="number" min="1" max="6" value="${c.sessionsPerWeek || (c.type === 'lab' ? 1 : 3)}"></div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="scSave">${isEdit ? 'Save Changes' : 'Add Course to Syllabus'}</button>
    </div>
  `;

  openModal(body);

  // Auto-adjust sessions when type toggles if default
  const typeSel = document.getElementById('sc-type');
  const sessInput = document.getElementById('sc-sessions');
  if (typeSel && sessInput && !isEdit) {
    typeSel.onchange = () => {
      sessInput.value = typeSel.value === 'lab' ? '1' : '3';
    };
  }

  document.getElementById('scSave').onclick = () => {
    const code = document.getElementById('sc-code').value.trim();
    if (!code) { toast('Course code is required.', 'warn'); return; }
    const title = document.getElementById('sc-title').value.trim() || code;
    const dept = document.getElementById('sc-dept').value;
    const credit = Number(document.getElementById('sc-credit').value) || 3.0;
    const type = document.getElementById('sc-type').value;
    const sessionsPerWeek = Number(document.getElementById('sc-sessions').value) || (type === 'lab' ? 1 : 3);

    const data = {
      semester: currentSemester,
      code,
      title,
      dept,
      credit,
      type,
      sessionsPerWeek
    };

    if (isEdit) {
      Object.assign(course, data);
      toast(`Course ${code} updated in syllabus`, 'ok');
    } else {
      if (!state.semesterCourses) state.semesterCourses = [];
      state.semesterCourses.push({ id: nextId(), ...data });
      toast(`Course ${code} added to ${currentSemester}`, 'ok');
    }

    // Also synchronize to any series currently running this semester
    const runningSeriesList = state.series.filter(s => s.runningSemester === currentSemester);
    if (runningSeriesList.length) {
      runningSeriesList.forEach(s => assignSemesterCoursesToSeries(s.id, currentSemester));
    }

    saveState();
    closeModal();
    renderSemesters();
  };
}

