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
      { key: 'email', label: 'Email Address', render: t => `<span style="color:var(--text-mute);font-size:12.5px;">${t.email || '—'}</span>` },
      {
        key: 'load', label: 'Teaching Load', render: t => {
          const theory = state.courses.filter(c => (c.teacherIds ? c.teacherIds.includes(t.id) : c.teacherId === t.id)).length;
          const labs = state.courses.filter(c => c.type === 'lab' && ((c.teacherIds ? c.teacherIds.includes(t.id) : false) || (c.groups || []).some(g => g.teacherId === t.id) || c.teacherId === t.id)).length;
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
        { key: 'email', label: 'Institutional Email', type: 'email', placeholder: 'name@ruet.ac.bd' }
      ],
      onSave: (d) => { state.teachers.push({ id: nextId(), ...d, dept: 'ECE', color: assignTeacherColor() }); renderTeachers(); toast('Faculty member added', 'ok'); }
    }),
    onEdit: (id) => openEditTeacherModal(state.teachers.find(x => x.id === id)),
    onDelete: (id) => { state.teachers = state.teachers.filter(x => x.id !== id); renderTeachers(); toast('Faculty member removed', 'info'); }
  });
}

function openEditTeacherModal(t) {
  if (!t) return;
  let currentColor = t.color ? Object.assign({}, t.color) : assignTeacherColor();
  const currentHex = currentColor.fg || '#4338ca';
  const currentBg = currentColor.bg || '#eef2ff';
  const currentBorder = currentColor.border || currentHex;

  const paletteSwatchesHtml = TEACHER_PALETTE.map((p, idx) => `
    <button type="button" class="swatch-btn ${currentColor.fg && currentColor.fg.toLowerCase() === p.fg.toLowerCase() ? 'active' : ''}" data-tpalette-idx="${idx}" title="${p.name} (${p.fg})" style="width:24px;height:24px;border-radius:50%;background:${p.fg};border:2px solid ${currentColor.fg && currentColor.fg.toLowerCase() === p.fg.toLowerCase() ? '#000' : 'transparent'};cursor:pointer;outline:none;padding:0;transition:transform 0.15s ease;"></button>
  `).join('');

  const modalHtml = `
    <div class="modal-header">
      <h2>Edit Faculty Member</h2>
      <div class="sub">Update name, routine initials, email, and display color for <strong>${t.shortName || t.name}</strong>.</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-form-body">
      <div class="field">
        <label for="tf-name">Full Name &amp; Title</label>
        <input id="tf-name" type="text" value="${t.name || ''}" placeholder="e.g. Prof. Dr. John Doe">
      </div>
      <div class="field-row">
        <div class="field">
          <label for="tf-short">Routine Initials (Grid Badge)</label>
          <input id="tf-short" type="text" value="${t.shortName || ''}" placeholder="e.g. JD">
        </div>
        <div class="field">
          <label for="tf-email">Email Address</label>
          <input id="tf-email" type="email" value="${t.email || ''}" placeholder="name@ruet.ac.bd">
        </div>
      </div>
      <div class="field" style="margin-top:6px;">
        <label>Routine Display Color</label>
        <div style="background:var(--bg-subtle,#f8fafc);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:4px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <div id="tfColorLivePreview" style="padding:6px 14px;border-radius:6px;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:8px;background:${currentBg};color:${currentHex};border:1.5px solid ${currentBorder};">
              <span id="tfColorDot" style="width:10px;height:10px;border-radius:50%;background:${currentHex};"></span>
              <span id="tfPreviewInitials">${t.shortName || 'FAC'}</span>
              <span style="font-size:11px;opacity:0.8;">(${t.name || 'Instructor'})</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <label for="tfColorPicker" style="font-size:12px;font-weight:600;color:var(--text-mute);">Custom Color:</label>
              <input type="color" id="tfColorPicker" value="${currentHex}" style="width:34px;height:30px;padding:0;border:none;border-radius:4px;cursor:pointer;background:none;">
            </div>
          </div>
          <div style="font-size:11px;font-weight:700;color:var(--text-mute);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;">Preset Academic Palette:</div>
          <div id="tfPaletteRow" style="display:flex;flex-wrap:wrap;gap:6px;">
            ${paletteSwatchesHtml}
          </div>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost btn-danger" id="tfDelete">Delete</button>
      <div style="flex:1;"></div>
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="tfSave">Save Changes</button>
    </div>
  `;

  openModal(modalHtml);

  const nameInput = document.getElementById('tf-name');
  const shortInput = document.getElementById('tf-short');
  const colorPicker = document.getElementById('tfColorPicker');
  const previewEl = document.getElementById('tfColorLivePreview');
  const previewDot = document.getElementById('tfColorDot');
  const previewInitials = document.getElementById('tfPreviewInitials');

  function updateColorUI(colorObj) {
    currentColor = Object.assign({}, colorObj);
    if (previewEl) {
      previewEl.style.background = currentColor.bg;
      previewEl.style.color = currentColor.fg;
      previewEl.style.borderColor = currentColor.border || currentColor.fg;
    }
    if (previewDot) previewDot.style.background = currentColor.fg;
    if (colorPicker) colorPicker.value = currentColor.fg;
    document.querySelectorAll('#tfPaletteRow .swatch-btn').forEach((btn, idx) => {
      const p = TEACHER_PALETTE[idx];
      if (p && p.fg.toLowerCase() === currentColor.fg.toLowerCase()) {
        btn.style.borderColor = '#000';
        btn.style.transform = 'scale(1.18)';
      } else {
        btn.style.borderColor = 'transparent';
        btn.style.transform = 'scale(1)';
      }
    });
  }

  if (shortInput) {
    shortInput.oninput = () => {
      if (previewInitials) previewInitials.textContent = shortInput.value.trim() || 'FAC';
    };
  }

  if (colorPicker) {
    colorPicker.oninput = () => {
      const hex = colorPicker.value;
      updateColorUI({
        name: 'Custom',
        fg: hex,
        bg: hex + '1a',
        border: hex
      });
    };
  }

  document.querySelectorAll('#tfPaletteRow .swatch-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.tpaletteIdx);
      if (TEACHER_PALETTE[idx]) {
        updateColorUI(TEACHER_PALETTE[idx]);
      }
    };
  });

  document.getElementById('tfSave').onclick = () => {
    const newName = nameInput.value.trim();
    if (!newName) { toast('Full name is required', 'warn'); nameInput.focus(); return; }
    t.name = newName;
    t.shortName = shortInput.value.trim();
    t.email = document.getElementById('tf-email').value.trim();
    t.color = Object.assign({}, currentColor);

    saveState();
    closeModal();
    renderTeachers();
    toast(`Faculty details and color for ${t.shortName || t.name} updated`, 'ok');
  };

  document.getElementById('tfDelete').onclick = () => {
    if (confirm(`Remove ${t.name} from faculty roster?`)) {
      state.teachers = state.teachers.filter(x => x.id !== t.id);
      saveState();
      closeModal();
      renderTeachers();
      toast('Faculty member removed', 'info');
    }
  };
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
