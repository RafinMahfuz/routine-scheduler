/* ============================= MODERN SETTINGS & SYSTEM CONFIG ============================= */
const DEFAULT_SETTINGS = {
  dept: "Department of Electrical & Computer Engineering",
  university: "Rajshahi University of Engineering & Technology",
  head: "Head, ECE, RUET",
  effectiveDate: "10/01/2026"
};
let settings = { ...DEFAULT_SETTINGS };

function renderSettings() {
  saveState();
  const seriesRows = state.series.map(s => `
    <div class="side-row series-mgmt-row">
      <div class="series-mgmt-info">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <strong style="color:var(--text);">${s.name}</strong>
          ${s.runningSemester ? `<span class="tag" style="background:var(--primary-soft);color:var(--primary);font-size:10.5px;font-weight:700;padding:1px 6px;">${s.runningSemester}</span>` : ''}
        </div>
        ${s.label ? `<div style="font-size:11.5px;color:var(--text-mute);margin-top:2px;">${s.label.split('|').join(' • ')}</div>` : ''}
        ${s.id === state.activeSeriesId ? `<span class="tag" style="background:var(--violet-soft);color:var(--violet-dark);font-size:10px;padding:1px 6px;margin-top:2px;">Active Selection</span>` : ''}
      </div>
      <div class="row-actions">
        <button class="table-action-btn edit" data-editseries="${s.id}" title="Rename or change running semester">✏️</button>
        <button class="table-action-btn delete" data-delseries="${s.id}" title="Delete batch">✕</button>
      </div>
    </div>`).join('');

  document.getElementById('mainArea').innerHTML = `
    <div class="topbar">
      <div class="page-title-group">
        <div class="page-breadcrumbs">System &rsaquo; Preferences &amp; Administration</div>
        <div class="page-title-row">
          <h1 class="page-title">Scheduler Settings</h1>
          ${state.isAdmin ? '<span class="tag admin-on">🔓 Admin Privileges Active</span>' : '<span class="tag read-only">🔒 Read-Only Visitor</span>'}
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <h3 style="margin-top:0;display:flex;align-items:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <span>Departmental Identity &amp; Header Info</span>
        </h3>
        <p style="font-size:12.5px;color:var(--text-mute);margin-top:0;margin-bottom:16px;">These details appear at the top of the Master Routine Sheet and official PDF printouts.</p>

        <div class="field"><label>Department Name</label><input id="s-dept" value="${settings.dept}"></div>
        <div class="field"><label>University Name</label><input id="s-univ" value="${settings.university}"></div>
        <div class="field"><label>Prepared / Approved By</label><input id="s-head" value="${settings.head}"></div>
        <div class="field">
          <label>Effective Date <span style="font-weight:400;color:var(--text-mute);">(Shown on Routine Header, e.g. "10/01/2026")</span></label>
          <input id="s-effdate" value="${settings.effectiveDate || ''}" placeholder="e.g. 10/01/2026">
        </div>
        <div class="field"><label>Max Lab Group Cohort Size</label><input id="s-groupsize" type="number" value="${LAB_GROUP_SIZE}" disabled title="Defined in system data model"></div>

        <button class="btn-primary" id="saveSettings" style="margin-top:8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Save Department Info</span>
        </button>
      </div>

      <div>
        <div class="side-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Academic Series (Batches)</span>
          </h3>
          <div style="max-height:220px;overflow-y:auto;padding-right:4px;">
            ${seriesRows || '<div class="side-row"><span class="v">No series configured.</span></div>'}
          </div>
          <button class="btn-ghost" id="addSeriesBtn" style="width:100%;margin-top:12px;">+ Add New Series</button>
        </div>

        <div class="side-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Security &amp; Admin Gate</span>
          </h3>
          <p style="font-size:12px;color:var(--text-mute);margin:0 0 12px 0;">${state.isAdmin ? 'Admin session active. Edit permissions granted.' : 'Authenticate to gain edit and auto-scheduling controls.'}</p>
          ${state.isAdmin ? `
            <div class="field"><label>Update Admin Password</label><input id="s-pass" type="password" placeholder="Enter new password"></div>
            <button class="btn-ghost" id="savePassBtn" style="width:100%;">Update Security Key</button>
            <button class="btn-ghost btn-danger" id="logoutBtn" style="margin-top:8px;width:100%;">Log Out Admin</button>
          ` : `<button class="btn-primary" id="loginBtn" style="width:100%;">Authenticate as Admin</button>`}
        </div>

        <div class="side-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
            <span>Worldwide Cloud Sync</span>
          </h3>
          <p style="font-size:12px;color:var(--text-mute);margin:0 0 12px 0;">Sync routine changes directly to the live website so everyone worldwide sees the updates in real time.</p>
          ${state.isAdmin ? `
            <button class="btn-primary" id="cloudPublishBtn" style="width:100%;margin-bottom:8px;">
              <span>☁️ Publish to Worldwide Cloud</span>
            </button>
            <button class="btn-ghost" id="cloudPullBtn" style="width:100%;">
              <span>📥 Pull Latest from Cloud</span>
            </button>
          ` : `
            <span class="tag read-only" style="width:100%;display:flex;justify-content:center;">Authenticate to sync changes</span>
          `}
        </div>

        <div class="side-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Data Backup &amp; Restore</span>
          </h3>
          <p style="font-size:12px;color:var(--text-mute);margin:0 0 12px 0;">Export your complete schedule configuration as a JSON file, or restore from a previous backup.</p>
          <button class="btn-ghost" id="exportDataBtn" style="width:100%;margin-bottom:8px;">📥 Export Backup (JSON)</button>
          <label class="btn-ghost" style="width:100%;display:flex;justify-content:center;cursor:pointer;margin-bottom:8px;">
            📤 Import Backup (JSON)
            <input type="file" id="importDataInput" accept=".json" style="display:none;">
          </label>
          ${state.isAdmin ? `
            <button class="btn-ghost btn-danger" id="resetSeedBtn" style="width:100%;">♻️ Reset to Official ECE Routine</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('saveSettings').onclick = requireAdmin(() => {
    settings.dept = document.getElementById('s-dept').value;
    settings.university = document.getElementById('s-univ').value;
    settings.head = document.getElementById('s-head').value;
    settings.effectiveDate = document.getElementById('s-effdate').value.trim();
    saveState();
    toast('Department information updated successfully', 'ok');
  });

  document.getElementById('addSeriesBtn').onclick = requireAdmin(() => {
    simpleFormModal({
      title: "Add Series / Batch", sub: "Create a new academic cohort and select its running semester.",
      fields: [
        { key: 'name', label: 'Series Name', placeholder: 'e.g. 26 Series' },
        { key: 'runningSemester', label: 'Select running semester', type: 'select', options: SEMESTERS }
      ],
      onSave: (d) => {
        const sem = d.runningSemester || SEMESTERS[0];
        const s = { id: nextId(), name: d.name, runningSemester: sem, label: `${sem}|${d.name}` };
        state.series.push(s);
        state.activeSeriesId = s.id;
        assignSemesterCoursesToSeries(s.id, sem);
        saveState();
        renderSettings();
        toast(`Series ${s.name} created for ${sem} with courses assigned!`, 'ok');
      }
    });
  });

  document.querySelectorAll('[data-editseries]').forEach(b => b.onclick = requireAdmin(() => {
    const s = state.series.find(x => x.id === Number(b.dataset.editseries));
    if (!s) return;
    const initialSem = s.runningSemester || SEMESTERS.find(sem => s.label && s.label.includes(sem)) || SEMESTERS[0];
    simpleFormModal({
      title: "Edit Series / Batch", sub: "Update series title or change its current running semester.",
      initial: { name: s.name, runningSemester: initialSem },
      fields: [
        { key: 'name', label: 'Series Name' },
        { key: 'runningSemester', label: 'Select running semester', type: 'select', options: SEMESTERS }
      ],
      onSave: (d) => {
        const oldSem = s.runningSemester;
        const newSem = d.runningSemester || SEMESTERS[0];
        s.name = d.name;
        s.runningSemester = newSem;
        s.label = `${newSem}|${s.name}`;

        if (oldSem !== newSem) {
          const hasClasses = state.classes.some(c => c.seriesId === s.id);
          let clearRoutine = false;
          if (hasClasses) {
            clearRoutine = confirm(`Running semester for ${s.name} changed from ${oldSem || 'previous'} to ${newSem}.\n\nDo you want to reset previous routine slots for ${s.name} so you can schedule the new semester's courses?`);
          }
          assignSemesterCoursesToSeries(s.id, newSem, clearRoutine);
          toast(`Series ${s.name} updated to ${newSem} — syllabus courses assigned!`, 'ok');
        } else {
          toast('Series updated', 'ok');
        }
        saveState();
        renderSettings();
      }
    });
  }));

  document.querySelectorAll('[data-delseries]').forEach(b => b.onclick = requireAdmin(() => {
    const id = Number(b.dataset.delseries);
    if (state.series.length <= 1) { toast('At least one series must remain.', 'warn'); return; }
    if (!confirm('Delete this series and all associated courses, students & routine data?')) return;
    state.series = state.series.filter(x => x.id !== id);
    state.courses = state.courses.filter(x => x.seriesId !== id);
    state.students = state.students.filter(x => x.seriesId !== id);
    state.classes = state.classes.filter(x => x.seriesId !== id);
    if (state.activeSeriesId === id) state.activeSeriesId = state.series[0].id;
    renderSettings();
    toast('Series and associated data deleted', 'info');
  }));

  if (document.getElementById('savePassBtn')) {
    document.getElementById('savePassBtn').onclick = requireAdmin(() => {
      const pass = document.getElementById('s-pass').value.trim();
      if (!pass) { toast('Please enter a valid password', 'warn'); return; }
      state.adminPassword = pass;
      saveState();
      document.getElementById('s-pass').value = '';
      toast('Admin password successfully updated!', 'ok');
    });
  }

  if (document.getElementById('loginBtn')) document.getElementById('loginBtn').onclick = () => openAdminLogin(renderSettings);
  if (document.getElementById('logoutBtn')) document.getElementById('logoutBtn').onclick = () => adminLogout();

  // Cloud Publish
  const cloudPubBtn = document.getElementById('cloudPublishBtn');
  if (cloudPubBtn) {
    cloudPubBtn.onclick = requireAdmin(async () => {
      const origText = cloudPubBtn.innerHTML;
      cloudPubBtn.innerHTML = '<span>⏳ Publishing to Cloud...</span>';
      cloudPubBtn.disabled = true;
      try {
        const payload = {
          state,
          settings: (typeof settings !== 'undefined') ? settings : undefined,
          uid
        };
        const pass = (state.adminPassword || 'admin123').trim();
        const res = await fetch('/api/routine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pass}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data && data.ok) {
          toast('Routine successfully published to worldwide cloud!', 'ok');
        } else {
          toast(data.message || 'Routine saved locally.', 'info');
        }
      } catch (e) {
        toast('Saved locally. Connect Vercel KV for real-time worldwide cloud sync.', 'info');
      } finally {
        cloudPubBtn.innerHTML = origText;
        cloudPubBtn.disabled = false;
      }
    });
  }

  // Cloud Pull
  const cloudPullBtn = document.getElementById('cloudPullBtn');
  if (cloudPullBtn) {
    cloudPullBtn.onclick = async () => {
      try {
        const res = await fetch('/api/routine');
        const data = await res.json();
        if (data && data.ok && data.payload && data.payload.state) {
          Object.assign(state, data.payload.state);
          if (data.payload.settings && typeof settings !== 'undefined') {
            Object.assign(settings, data.payload.settings);
          }
          if (data.payload.uid) setUid(data.payload.uid);
          saveState();
          renderSettings();
          toast('Latest worldwide cloud routine loaded!', 'ok');
        } else {
          toast(data.message || 'No cloud routine found. Showing local data.', 'info');
        }
      } catch (e) {
        toast('Could not connect to cloud API. Running in local mode.', 'warn');
      }
    };
  }

  // Export JSON
  document.getElementById('exportDataBtn').onclick = () => {
    const backupData = {
      version: 1,
      date: new Date().toISOString(),
      settings,
      state: {
        series: state.series,
        rooms: state.rooms,
        labs: state.labs,
        teachers: state.teachers,
        courses: state.courses,
        students: state.students,
        classes: state.classes,
        meeting: state.meeting
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruet-ece-routine-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Routine data exported successfully', 'ok');
  };

  // Import JSON
  const importInput = document.getElementById('importDataInput');
  if (importInput) {
    importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed && parsed.state) {
            Object.assign(state, parsed.state);
            if (parsed.settings) Object.assign(settings, parsed.settings);
            saveState();
            renderSettings();
            toast('Backup restored successfully!', 'ok');
          } else {
            toast('Invalid backup file format.', 'error');
          }
        } catch (err) {
          toast('Failed to parse backup file.', 'error');
        }
      };
      reader.readAsText(file);
    };
  }

  if (document.getElementById('resetSeedBtn')) {
    document.getElementById('resetSeedBtn').onclick = requireAdmin(() => {
      if (!confirm('Reset everything to the official department routine? All current customizations will be replaced.')) return;
      resetToSeedData();
      state.activeNav = 'routine';
      renderAll();
      toast('Routine restored to official department seed data', 'ok');
    });
  }
}
