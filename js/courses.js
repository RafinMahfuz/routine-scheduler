/* ============================= COURSES & TEACHER ASSIGNMENT ============================= */

function renderCourses() {
  saveState();
  crudPage({
    title: "Academic Courses",
    sub: `Curriculum definitions, teacher assignments, and parallel lab group configurations for ${activeSeries() ? activeSeries().name : 'current batch'}.`,
    icon: "📘",
    items: coursesInActiveSeries(),
    addLabel: "Add New Course",
    seriesRow: renderCourses,
    columns: [
      { key: 'code', label: 'Course Code', render: c => `<strong style="color:var(--text);font-family:inherit;">${c.code}</strong>` },
      { key: 'title', label: 'Title &amp; Subject', render: c => `<div><strong>${c.title}</strong><div style="font-size:11.5px;color:var(--text-mute);">${c.dept} • ${c.credit} Credits</div></div>` },
      { key: 'type', label: 'Type', render: c => `<span class="tag" style="background:${c.type === 'lab' ? 'var(--c-lab-bg)' : 'var(--violet-soft)'};color:${c.type === 'lab' ? 'var(--c-lab-fg)' : 'var(--violet-dark)'};font-weight:700;">${c.type === 'lab' ? '🧪 Sessional Lab' : '📘 Theory Class'}</span>` },
      { key: 'sessionsPerWeek', label: 'Weekly Load', render: c => `<span style="font-weight:600;">${c.sessionsPerWeek} session(s)</span>` },
      {
        key: 'teacher', label: 'Assigned Instructor(s)', render: c => {
          if (c.type === 'theory') {
            const t = teacherById(c.teacherId);
            return t
              ? `<div style="display:flex;align-items:center;gap:6px;"><span class="swatch" style="background:${t.color.fg};"></span><strong>${teacherShort(t)}</strong> <span style="font-size:12px;color:var(--text-mute);">(${t.name})</span></div>`
              : '<span class="tag" style="background:#fee2e2;color:#991b1b;font-weight:700;">⚠️ Not Assigned</span>';
          }
          const groups = computeLabGroups(c);
          return `<div style="display:flex;flex-direction:column;gap:3px;">${groups.map((g, i) => {
            const t = teacherById(g.teacherId);
            const lab = labById(g.labId);
            return `<div style="font-size:12px;"><span class="tag" style="background:#f3f4f6;color:#374151;font-weight:700;padding:2px 6px;">Grp ${String.fromCharCode(65 + i)}</span> <strong>${t ? teacherShort(t) : 'Unassigned'}</strong> <span style="color:var(--text-mute);">in ${lab ? lab.name : 'No Lab'}</span></div>`;
          }).join('')}</div>`;
        }
      },
      { key: 'studentCount', label: 'Students', render: c => `<span class="tag" style="background:#f1f5f9;color:#475569;font-weight:700;">${c.studentCount} students</span>` }
    ],
    onAdd: () => openCourseModal(null),
    onEdit: (id) => openCourseModal(state.courses.find(x => x.id === id)),
    onDelete: (id) => { state.courses = state.courses.filter(x => x.id !== id); renderCourses(); toast('Course removed', 'info'); }
  });

  // Inject "Quick Change Teacher" action button on each course row
  document.querySelectorAll('[data-edit]').forEach(b => {
    const actions = b.closest('.row-actions');
    if (actions && !actions.querySelector('[data-quickteacher]')) {
      const id = Number(b.dataset.edit);
      const btn = document.createElement('button');
      btn.className = 'table-action-btn quick-teacher';
      btn.setAttribute('data-quickteacher', id);
      btn.title = "Quickly reassign teacher without opening full edit form";
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg><span>Faculty</span>`;
      btn.onclick = requireAdmin(() => openQuickTeacherModal(id));
      actions.insertBefore(btn, actions.firstChild);
    }
  });
}

function courseGroupsHtml(course) {
  const groups = computeLabGroups(course);
  return groups.map((g, i) => `
    <div class="group-box">
      <div class="grouplabel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Group ${String.fromCharCode(65 + i)} (${g.size} students)</span>
      </div>
      <div class="field-row">
        <div class="field"><label>Allocated Lab Facility</label>
          <select id="grp-lab-${i}">
            <option value="">— Select Lab —</option>
            ${state.labs.map(l => `<option value="${l.id}" ${g.labId === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Instructor</label>
          <select id="grp-teacher-${i}">
            <option value="">— Select Teacher —</option>
            ${state.teachers.map(t => `<option value="${t.id}" ${g.teacherId === t.id ? 'selected' : ''}>${teacherOptionLabel(t)}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>`).join('') + `
    <div class="hint-card">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <span>Groups run simultaneously in parallel at the same day &amp; slot across designated lab rooms.</span>
    </div>`;
}

function openCourseModal(course) {
  const isEdit = !!course;
  const c = course || { code: '', title: '', credit: 3, dept: 'ECE', type: 'theory', sessionsPerWeek: 1, studentCount: 60, teacherId: null, groups: [] };

  const body = () => `
    <div class="modal-header">
      <h2>${isEdit ? 'Edit Course Information' : 'Register New Course'}</h2>
      <div class="sub">Set up syllabus codes, department attributes, and faculty allocations for <strong>${activeSeries() ? activeSeries().name : ''}</strong>.</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-form-body">
      <div class="field-row">
        <div class="field"><label>Course Code</label><input id="cf-code" value="${c.code}" placeholder="e.g. ECE 2101"></div>
        <div class="field"><label>Course Title</label><input id="cf-title" value="${c.title}" placeholder="e.g. Digital Electronics"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Department</label><select id="cf-dept">${DEPTS.map(d => `<option ${c.dept === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
        <div class="field"><label>Credits</label><input id="cf-credit" type="number" step="0.5" value="${c.credit}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Course Category</label>
          <select id="cf-type">
            <option value="theory" ${c.type === 'theory' ? 'selected' : ''}>Theory Class (50 min, 8:00–1:20 only)</option>
            <option value="lab" ${c.type === 'lab' ? 'selected' : ''}>Sessional Lab (2 hr 30 min, flexible)</option>
          </select>
        </div>
        <div class="field"><label>Sessions / Week</label><input id="cf-sessions" type="number" min="1" max="6" value="${c.sessionsPerWeek}"></div>
      </div>
      <div class="field"><label>Total Student Enrolled</label><input id="cf-students" type="number" min="1" value="${c.studentCount}"></div>

      <div id="teacherSection"></div>
    </div>

    <div class="modal-actions">
      ${isEdit ? `<button class="btn-ghost btn-danger" id="cDel">Delete Course</button><div style="flex:1;"></div>` : ''}
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="cSave">Save Course Details</button>
    </div>
  `;

  openModal(body());

  function renderTeacherSection() {
    const type = document.getElementById('cf-type').value;
    const students = Number(document.getElementById('cf-students').value) || 0;
    const box = document.getElementById('teacherSection');
    if (type === 'theory') {
      box.innerHTML = `<div class="field"><label>Assign Theory Instructor</label>
        <select id="cf-teacher"><option value="">— Select Instructor —</option>${state.teachers.map(t => `<option value="${t.id}" ${c.teacherId === t.id ? 'selected' : ''}>${teacherOptionLabel(t)} — ${t.dept}</option>`).join('')}</select>
      </div>`;
    } else {
      box.innerHTML = `<label style="display:block;font-size:12.5px;font-weight:700;margin-bottom:8px;color:var(--violet-dark);">Parallel Lab Groups (${LAB_GROUP_SIZE} students per group)</label>` + courseGroupsHtml({ ...c, studentCount: students });
    }
  }
  renderTeacherSection();
  document.getElementById('cf-type').onchange = renderTeacherSection;
  document.getElementById('cf-students').oninput = renderTeacherSection;

  document.getElementById('cSave').onclick = () => {
    const code = document.getElementById('cf-code').value.trim();
    if (!code) { toast('Course code is required.', 'warn'); return; }
    const type = document.getElementById('cf-type').value;
    const studentCount = Number(document.getElementById('cf-students').value) || 0;
    const data = {
      code, title: document.getElementById('cf-title').value.trim(),
      dept: document.getElementById('cf-dept').value,
      credit: Number(document.getElementById('cf-credit').value) || 0,
      type, sessionsPerWeek: Number(document.getElementById('cf-sessions').value) || 1,
      studentCount,
    };
    if (type === 'theory') {
      data.teacherId = Number(document.getElementById('cf-teacher').value) || null;
      data.groups = [];
    } else {
      const n = Math.max(1, Math.ceil(studentCount / LAB_GROUP_SIZE));
      data.teacherId = null;
      data.groups = [];
      for (let i = 0; i < n; i++) {
        data.groups.push({
          labId: Number(document.getElementById('grp-lab-' + i).value) || null,
          teacherId: Number(document.getElementById('grp-teacher-' + i).value) || null,
        });
      }
    }
    if (isEdit) { Object.assign(course, data); toast(`Course ${data.code} updated`, 'ok'); }
    else { state.courses.push({ id: nextId(), seriesId: state.activeSeriesId, ...data }); toast(`Course ${data.code} created`, 'ok'); }
    closeModal(); renderCourses();
  };
  if (isEdit) document.getElementById('cDel').onclick = () => { state.courses = state.courses.filter(x => x.id !== course.id); closeModal(); renderCourses(); toast('Course removed', 'info'); };
}

/* Quick Teacher Reassignment Modal */
function openQuickTeacherModal(courseId) {
  const c = state.courses.find(x => x.id === courseId);
  if (!c) return;
  const isLab = c.type === 'lab';
  const body = isLab
    ? courseGroupsHtml(c)
    : `<div class="field"><label>Assign Theory Instructor</label>
        <select id="qt-teacher"><option value="">— Select Instructor —</option>${state.teachers.map(t => `<option value="${t.id}" ${c.teacherId === t.id ? 'selected' : ''}>${teacherOptionLabel(t)} — ${t.dept}</option>`).join('')}</select>
      </div>`;
  openModal(`
    <div class="modal-header">
      <div class="modal-badge-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      </div>
      <h2>Reassign Faculty — ${c.code}</h2>
      <div class="sub">${c.title}</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-form-body">
      ${body}
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="qtSave">Confirm Reassignment</button>
    </div>
  `);
  document.getElementById('qtSave').onclick = () => {
    if (isLab) {
      const groups = computeLabGroups(c);
      c.groups = groups.map((g, i) => ({
        labId: Number(document.getElementById('grp-lab-' + i).value) || null,
        teacherId: Number(document.getElementById('grp-teacher-' + i).value) || null,
      }));
    } else {
      c.teacherId = Number(document.getElementById('qt-teacher').value) || null;
    }
    closeModal();
    if (state.activeNav === 'courses') renderCourses();
    else if (state.activeNav === 'dashboard') renderDashboard();
    else renderRoutine();
    toast(`Instructor assigned for ${c.code}`, 'ok');
  };
}
