/* ============================= GENERIC CRUD PAGE ============================= */

function crudPage({ title, sub, icon, items, columns, addLabel, onAdd, onEdit, onDelete, seriesRow }) {
  let currentFilter = '';

  function renderTableContent() {
    const filtered = currentFilter
      ? items.filter(item => {
        const q = currentFilter.toLowerCase();
        return columns.some(c => {
          const val = String(item[c.key] || '');
          return val.toLowerCase().includes(q);
        });
      })
      : items;

    const rows = filtered.length ? filtered.map(item => `
      <tr>
        ${columns.map(col => `<td>${col.render ? col.render(item) : (item[col.key] || '—')}</td>`).join('')}
        <td style="text-align:right;">
          <div class="row-actions">
            <button class="table-action-btn edit" data-edit="${item.id}" title="Edit Record">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            <button class="table-action-btn delete" data-del="${item.id}" title="Delete Record">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>`).join('') : `
      <tr>
        <td colspan="${columns.length + 1}">
          <div class="empty-state">
            <div class="empty-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            </div>
            <div class="empty-title">No matching records found</div>
            <div class="empty-sub">${currentFilter ? 'Try adjusting your search query.' : `Click "${addLabel}" to create your first entry.`}</div>
          </div>
        </td>
      </tr>`;

    const tbody = document.getElementById('crudTableBody');
    if (tbody) tbody.innerHTML = rows;

    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = requireAdmin(() => onEdit(Number(b.dataset.edit))));
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = requireAdmin(() => {
      if (confirm('Delete this record?')) onDelete(Number(b.dataset.del));
    }));
    document.querySelectorAll('[data-pick-color]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      if (typeof openTeacherColorPicker === 'function') openTeacherColorPicker(Number(b.dataset.pickColor));
    });
  }


  document.getElementById('mainArea').innerHTML = `
    <div class="topbar">
      <div class="page-title-group">
        <div class="page-breadcrumbs">Department Management &rsaquo; ${title}</div>
        <div class="page-title-row">
          <h1 class="page-title">${title}</h1>
          <span class="count-pill-badge">${items.length} records</span>
        </div>
      </div>
      <div class="top-spacer"></div>
      <div class="topbar-actions">
        <div class="table-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="crudTableFilter" placeholder="Filter ${title.toLowerCase()}...">
        </div>
        <button class="btn-primary" id="addBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${addLabel}</span>
        </button>
      </div>
    </div>

    ${seriesRow ? `<div class="series-row" id="seriesRow"></div>` : ''}

    <div class="card table-card">
      <div class="table-responsive-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              ${columns.map(c => `<th>${c.label}</th>`).join('')}
              <th style="width:160px;text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="crudTableBody"></tbody>
        </table>
      </div>
    </div>
  `;

  if (seriesRow) renderSeriesTabs('seriesRow', seriesRow);

  renderTableContent();

  const filterInput = document.getElementById('crudTableFilter');
  if (filterInput) {
    filterInput.oninput = (e) => {
      currentFilter = e.target.value.trim();
      renderTableContent();
    };
  }

  document.getElementById('addBtn').onclick = requireAdmin(onAdd);
}

/* ---- Rooms ---- */
function renderRooms() {
  saveState();
  crudPage({
    title: "Rooms", sub: "Classrooms and lecture halls allocated for departmental routine sessions.", icon: "🚪",
    items: state.rooms, addLabel: "Add Room",
    columns: [
      { key: 'code', label: 'Room Identifier', render: r => `<strong style="color:var(--text);font-family:inherit;">${r.code}</strong>` },
      { key: 'loc', label: 'Location &amp; Building Details', render: r => `<span style="color:var(--text-mute);">${r.loc || 'Main Campus'}</span>` }
    ],
    onAdd: () => simpleFormModal({
      title: "Add Classroom / Lecture Room", sub: "Register a room code and campus location.",
      fields: [
        { key: 'code', label: 'Room Code', placeholder: 'e.g. R-405' },
        { key: 'loc', label: 'Location / Building', placeholder: 'e.g. Research Building, 4th Floor' }
      ],
      onSave: (d) => { state.rooms.push({ id: nextId(), ...d }); renderRooms(); toast('Room added successfully', 'ok'); }
    }),
    onEdit: (id) => {
      const r = state.rooms.find(x => x.id === id);
      simpleFormModal({
        title: "Edit Room Details", sub: "Update room code or location.", initial: r,
        fields: [
          { key: 'code', label: 'Room Code' },
          { key: 'loc', label: 'Location / Building' }
        ],
        onSave: (d) => { Object.assign(r, d); renderRooms(); toast('Room updated', 'ok'); },
        onDelete: () => { state.rooms = state.rooms.filter(x => x.id !== id); renderRooms(); toast('Room deleted', 'info'); }
      });
    },
    onDelete: (id) => { state.rooms = state.rooms.filter(x => x.id !== id); renderRooms(); toast('Room deleted', 'info'); }
  });
}

/* ---- Labs ---- */
function renderLabs() {
  saveState();
  crudPage({
    title: "Labs", sub: "Sessional laboratories utilized for parallel groups (≤30 students per lab).", icon: "🧪",
    items: state.labs, addLabel: "Add Laboratory",
    columns: [
      { key: 'index', label: 'Sl.', render: (l) => `<strong>Lab-${state.labs.indexOf(l) + 1}</strong>` },
      { key: 'name', label: 'Laboratory Name', render: l => `<span style="font-weight:600;color:var(--text);">${l.name}</span>` }
    ],
    onAdd: () => simpleFormModal({
      title: "Register Laboratory", sub: "Enter laboratory designation for sessional courses.",
      fields: [{ key: 'name', label: 'Lab Name', placeholder: 'e.g. Signal Processing &amp; DSP Lab' }],
      onSave: (d) => { state.labs.push({ id: nextId(), ...d }); renderLabs(); toast('Lab facility added', 'ok'); }
    }),
    onEdit: (id) => {
      const l = state.labs.find(x => x.id === id);
      simpleFormModal({
        title: "Edit Lab Details", sub: "Update laboratory name.", initial: l,
        fields: [{ key: 'name', label: 'Lab Name' }],
        onSave: (d) => { Object.assign(l, d); renderLabs(); toast('Lab updated', 'ok'); },
        onDelete: () => { state.labs = state.labs.filter(x => x.id !== id); renderLabs(); toast('Lab removed', 'info'); }
      });
    },
    onDelete: (id) => { state.labs = state.labs.filter(x => x.id !== id); renderLabs(); toast('Lab removed', 'info'); }
  });
}

/* ---- Teachers ---- */
function renderTeachers() {
  saveState();
  crudPage({
    title: "Faculty Members", sub: "Instructors and course coordinators. Each teacher receives an exclusive routine color code.", icon: "🧑‍🏫",
    items: state.teachers, addLabel: "Add Faculty",
    columns: [
      { key: 'color', label: 'Color Tag', render: t => `<button class="teacher-color-change-btn" data-pick-color="${t.id}" title="Click to customize ${t.shortName || t.name}'s color" style="display:inline-flex;align-items:center;gap:6px;background:none;border:1px solid var(--border);padding:3px 8px;border-radius:6px;cursor:pointer;"><span class="swatch" style="background:${t.color.fg};"></span><span style="font-size:12px;font-weight:700;color:${t.color.fg};">${t.color.name || 'Custom'}</span><span style="font-size:11px;opacity:0.7;">🎨</span></button>` },

      { key: 'shortName', label: 'Routine Initials', render: t => `<strong class="teacher-short-tag" style="color:${t.color.fg};background:${t.color.bg};">${t.shortName || '—'}</strong>` },
      { key: 'name', label: 'Full Name &amp; Title', render: t => `<span style="font-weight:600;color:var(--text);">${t.name}</span>` },
      { key: 'dept', label: 'Department', render: t => `<span class="tag dept-tag" style="background:var(--c-${t.dept.toLowerCase()}-bg,#eee);color:var(--c-${t.dept.toLowerCase()}-fg,#555);">${t.dept}</span>` },
      { key: 'email', label: 'Email Address', render: t => `<span style="color:var(--text-mute);font-size:12.5px;">${t.email || '—'}</span>` },
      {
        key: 'load', label: 'Teaching Load', render: t => {
          const theory = state.courses.filter(c => c.teacherId === t.id).length;
          const labs = state.courses.filter(c => c.type === 'lab' && (c.groups || []).some(g => g.teacherId === t.id)).length;
          return (theory + labs)
            ? `<span class="tag" style="background:#e0e7ff;color:#4338ca;font-weight:700;">${theory + labs} courses</span>`
            : '<span style="color:var(--text-mute);font-size:12px;">Unallocated</span>';
        }
      }
    ],
    onAdd: () => simpleFormModal({
      title: "Add Faculty Member", sub: "Register teacher information. Routine display color is assigned automatically.",
      fields: [
        { key: 'name', label: 'Full Name with Title', placeholder: 'e.g. Dr. Jane Doe' },
        { key: 'shortName', label: 'Short Form (Grid Initials)', placeholder: 'e.g. JD' },
        { key: 'dept', label: 'Department', type: 'select', options: DEPTS },
        { key: 'email', label: 'Institutional Email', type: 'email', placeholder: 'name@ruet.ac.bd' }
      ],
      onSave: (d) => { state.teachers.push({ id: nextId(), ...d, color: assignTeacherColor() }); renderTeachers(); toast('Faculty member added', 'ok'); }
    }),
    onEdit: (id) => {
      const t = state.teachers.find(x => x.id === id);
      simpleFormModal({
        title: "Edit Faculty Member", sub: "Update name, initials, department or email.", initial: t,
        fields: [
          { key: 'name', label: 'Full Name' },
          { key: 'shortName', label: 'Short Form (Grid Initials)', placeholder: 'e.g. JD' },
          { key: 'dept', label: 'Department', type: 'select', options: DEPTS },
          { key: 'email', label: 'Email Address' }
        ],
        onSave: (d) => { Object.assign(t, d); renderTeachers(); toast('Faculty details saved', 'ok'); },
        onDelete: () => { state.teachers = state.teachers.filter(x => x.id !== id); renderTeachers(); toast('Faculty member removed', 'info'); }
      });
    },
    onDelete: (id) => { state.teachers = state.teachers.filter(x => x.id !== id); renderTeachers(); toast('Faculty member removed', 'info'); }
  });
}

/* ---- Students ---- */
function renderStudents() {
  saveState();
  crudPage({
    title: "Enrolled Students", sub: `Single section cohort of 60 students registered for ${activeSeries() ? activeSeries().name : 'active batch'}.`, icon: "🎓",
    items: studentsInActiveSeries(), addLabel: "Add Student", seriesRow: renderStudents,
    columns: [
      { key: 'roll', label: 'Roll Number', render: s => `<strong style="color:var(--text);font-family:inherit;">${s.roll}</strong>` },
      { key: 'name', label: 'Student Name', render: s => `<span style="font-weight:600;">${s.name}</span>` },
      { key: 'semester', label: 'Enrolled Semester / Year', render: s => `<span class="tag" style="background:var(--violet-soft);color:var(--violet-dark);">${s.semester}</span>` }
    ],
    onAdd: () => simpleFormModal({
      title: "Enroll Student", sub: `Register a student in ${activeSeries() ? activeSeries().name : ''}.`,
      fields: [
        { key: 'roll', label: 'Roll Number', placeholder: 'e.g. 2001004' },
        { key: 'name', label: 'Full Name', placeholder: 'e.g. John Doe' },
        { key: 'semester', label: 'Semester / Year', placeholder: 'e.g. 1st Year Odd Semester' }
      ],
      onSave: (d) => { state.students.push({ id: nextId(), seriesId: state.activeSeriesId, ...d }); renderStudents(); toast('Student enrolled', 'ok'); }
    }),
    onEdit: (id) => {
      const s = state.students.find(x => x.id === id);
      simpleFormModal({
        title: "Edit Student Enrollment", sub: "Update roll, name, or semester.", initial: s,
        fields: [
          { key: 'roll', label: 'Roll Number' },
          { key: 'name', label: 'Full Name' },
          { key: 'semester', label: 'Semester / Year' }
        ],
        onSave: (d) => { Object.assign(s, d); renderStudents(); toast('Student profile updated', 'ok'); },
        onDelete: () => { state.students = state.students.filter(x => x.id !== id); renderStudents(); toast('Student record removed', 'info'); }
      });
    },
    onDelete: (id) => { state.students = state.students.filter(x => x.id !== id); renderStudents(); toast('Student record removed', 'info'); }
  });
}
