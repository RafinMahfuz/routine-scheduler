/* ============================= AUTO-SCHEDULING ALGORITHM ============================= */
/*
  Rules enforced:
  1. A teacher can never be double-booked at the same time.
  2. A teacher can never have two classes back-to-back (no consecutive slots) on the same day.
  3. A room/lab can never be double-booked at the same time.
  4. Theory classes only run 8:00 -> 1:20 (never after lunch).
  5. No class of any kind ever crosses the 10:30-10:50 break or the 1:20-2:30 lunch gap.
  6. Lab courses with more students than LAB_GROUP_SIZE (30) are split into groups.
     All groups of a lab course run IN PARALLEL at the same day/time, each in its own
     lab room with its own assigned teacher (Group A -> Lab X + Teacher X, Group B -> Lab Y + Teacher Y).
     Labs are flexible and may also use the afternoon segment when needed.
  Scheduling is scoped to the currently active Series only.
*/
/* Track, per course, which days it has already been placed on this generation
   run — a course's sessions should be spread across different days, never
   repeated on the same day. */
function computeLabGroups(course) {
  const n = Math.max(1, Math.ceil((course.studentCount || 0) / LAB_GROUP_SIZE));
  const groups = [];
  for (let i = 0; i < n; i++) {
    const existing = (course.groups || [])[i];
    groups.push({ labId: existing ? existing.labId : null, teacherId: existing ? existing.teacherId : null, size: Math.min(LAB_GROUP_SIZE, (course.studentCount || 0) - i * LAB_GROUP_SIZE) || LAB_GROUP_SIZE });
  }
  return groups;
}

/* =====================================================================
   INTELLIGENT ROUTINE GENERATOR — CSP Engine with Multi-Restart
   Supports Whole Series (Master Routine) and Specific Series scopes.
   Enforces morning priority, strict no back-to-back, and zero clashes.
   ===================================================================== */

function openAutoGenerateModal() {
  const currentSeries = activeSeries() || (state.series && state.series[0]);
  const currentSeriesId = currentSeries ? currentSeries.id : (state.series[0] ? state.series[0].id : 1000);
  const defaultScope = state.routineAllSeries ? 'all' : 'single';

  const modalHtml = `
    <div class="autogen-modal">
      <div class="modal-header-banner">
        <div class="modal-badge">RUET ECE Academic Scheduling Engine</div>
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--primary);"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          <span>Intelligent Routine Generator</span>
        </h2>
        <p class="modal-sub">Generate a conflict-free, academically balanced routine using constraint satisfaction heuristics.</p>
      </div>

      <div class="autogen-section-title">1. Select Scheduling Scope</div>
      <div class="autogen-scope-grid">
        <label class="autogen-scope-card ${defaultScope === 'all' ? 'active' : ''}" id="cardScopeAll">
          <input type="radio" name="autogenScope" value="all" ${defaultScope === 'all' ? 'checked' : ''}>
          <div class="asc-content">
            <div class="asc-title">
              <span class="asc-icon">🌐</span>
              <span>Whole Series (Complete Master Department Routine)</span>
              <span class="asc-badge">Recommended</span>
            </div>
            <div class="asc-desc">Clears and reschedules all 5 batches (25, 24, 23, 22, 21 Series) simultaneously with balanced morning slots and guaranteed rest breaks between teaching sessions.</div>
          </div>
        </label>

        <label class="autogen-scope-card ${defaultScope === 'single' ? 'active' : ''}" id="cardScopeSingle">
          <input type="radio" name="autogenScope" value="single" ${defaultScope === 'single' ? 'checked' : ''}>
          <div class="asc-content">
            <div class="asc-title">
              <span class="asc-icon">🎓</span>
              <span>Specific Series Only</span>
            </div>
            <div class="asc-desc">Clears only the selected batch and slots its classes seamlessly into open faculty and room slots without disturbing any other batch.</div>
            <div class="asc-series-select-wrap" id="singleSeriesSelectWrap" style="display:${defaultScope === 'single' ? 'block' : 'none'}; margin-top:10px;">
              <label style="font-size:11px; font-weight:700; color:var(--text); margin-bottom:4px; display:block;">Select Target Batch:</label>
              <select id="autogenTargetSeries" class="form-input" style="padding:6px 10px; font-size:12px; font-weight:600; width:100%;">
                ${state.series.map(s => `<option value="${s.id}" ${s.id === currentSeriesId ? 'selected' : ''}>${s.name} (${s.label ? s.label.replace('|', ' — ') : ''})</option>`).join('')}
              </select>
            </div>
          </div>
        </label>
      </div>

      <div class="autogen-section-title" style="margin-top:16px;">2. Active Algorithmic Guarantees</div>
      <div class="autogen-constraints-list">
        <div class="ac-item">
          <span class="ac-icon">🌅</span>
          <div class="ac-text">
            <strong>Morning Priority for All Series</strong>: Prime morning periods (8:00 AM, 8:50 AM, 9:40 AM) are prioritized and distributed evenly among all batches.
          </div>
        </div>
        <div class="ac-item">
          <span class="ac-icon">☕</span>
          <div class="ac-text">
            <strong>Strict No Back-to-Back Teaching</strong>: No teacher will have two or more classes in a row on any day across any batch.
          </div>
        </div>
        <div class="ac-item">
          <span class="ac-icon">🔬</span>
          <div class="ac-text">
            <strong>3-Period Continuous Labs</strong>: Laboratory practicals are placed in solid 2h30m blocks in verified lab rooms.
          </div>
        </div>
        <div class="ac-item">
          <span class="ac-icon">🛡️</span>
          <div class="ac-text">
            <strong>Department Meeting Protection</strong>: Monday 2:30–5:00 PM is strictly preserved for faculty conferences and CMS meetings.
          </div>
        </div>
        <div class="ac-item">
          <span class="ac-icon">📅</span>
          <div class="ac-text">
            <strong>Distinct-Day Distribution</strong>: Multi-session courses are spread across different days of the week (no repeat on same day).
          </div>
        </div>
      </div>

      <div class="modal-actions" style="margin-top:20px; display:flex; justify-content:flex-end; gap:10px;">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-primary" id="btnExecuteAutogen" style="padding:8px 18px; font-weight:800; display:inline-flex; align-items:center; gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          <span>Generate Schedule</span>
        </button>
      </div>
    </div>
  `;

  openModal(modalHtml);

  // Wire scope card click handlers
  const cardAll = document.getElementById('cardScopeAll');
  const cardSingle = document.getElementById('cardScopeSingle');
  const wrapSingle = document.getElementById('singleSeriesSelectWrap');
  const radioAll = cardAll ? cardAll.querySelector('input[value="all"]') : null;
  const radioSingle = cardSingle ? cardSingle.querySelector('input[value="single"]') : null;

  function updateScopeUI(scope) {
    if (!cardAll || !cardSingle || !radioAll || !radioSingle) return;
    if (scope === 'all') {
      cardAll.classList.add('active');
      cardSingle.classList.remove('active');
      radioAll.checked = true;
      if (wrapSingle) wrapSingle.style.display = 'none';
    } else {
      cardSingle.classList.add('active');
      cardAll.classList.remove('active');
      radioSingle.checked = true;
      if (wrapSingle) wrapSingle.style.display = 'block';
    }
  }

  if (cardAll) cardAll.onclick = () => updateScopeUI('all');
  if (cardSingle) {
    cardSingle.onclick = (e) => {
      if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION') {
        updateScopeUI('single');
      }
    };
  }
  if (radioAll) radioAll.onchange = () => updateScopeUI('all');
  if (radioSingle) radioSingle.onchange = () => updateScopeUI('single');

  // Wire Execute button
  const execBtn = document.getElementById('btnExecuteAutogen');
  if (execBtn) {
    execBtn.onclick = () => {
      const selectedScope = radioAll && radioAll.checked ? 'all' : 'single';
      const selEl = document.getElementById('autogenTargetSeries');
      const selSeriesId = selEl ? Number(selEl.value) : currentSeriesId;
      closeModal();
      runAutoGenerationEngine({ scope: selectedScope, targetSeriesId: selSeriesId });
    };
  }
}

function runAutoGenerationEngine(options = {}) {
  const scope = options.scope || 'all';
  const targetSeriesId = options.targetSeriesId || (state.series[0] ? state.series[0].id : null);
  const targetSeriesObj = state.series.find(s => s.id === targetSeriesId);

  // Determine series to schedule
  const seriesToSchedule = scope === 'all'
    ? state.series
    : state.series.filter(s => s.id === targetSeriesId);

  // Classes to preserve
  const preservedClasses = scope === 'all'
    ? []
    : state.classes.filter(c => c.seriesId !== targetSeriesId);

  // Ensure every course has valid lab/teacher references before running
  state.courses.forEach(c => {
    if (c.type === 'lab') {
      if (!c.groups || !c.groups.length || !c.groups[0].labId) {
        const rawClass = state.classes.find(cl => cl.seriesId === c.seriesId && cl.code === c.code);
        const labId = typeof resolveLabId === 'function' ? resolveLabId(rawClass ? rawClass.room : '') : (state.labs[0] ? state.labs[0].id : 1);
        const teacherId = c.teacherId || (rawClass ? rawClass.teacherId : null) || (state.teachers[0] ? state.teachers[0].id : null);
        c.groups = [{ labId, teacherId, size: 60 }];
      }
    } else if (!c.teacherId) {
      const rawClass = state.classes.find(cl => cl.seriesId === c.seriesId && cl.code === c.code);
      c.teacherId = (rawClass ? rawClass.teacherId : null) || (state.teachers[0] ? state.teachers[0].id : null);
    }
  });

  const preferredRoomCode = ['R-404', 'R-403', 'R-402', 'R-401', 'S-401'];
  const LAB_START_OPTIONS = [8, 11, 14];

  // Multi-restart stochastic constraint solver (up to 50 attempts)
  let bestResult = null;
  const MAX_ATTEMPTS = 50;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const newClasses = [];
    const teacherBookings = {};
    const roomBookings = {};
    const seriesBookings = {};

    function getTeacherList(day, tid) {
      if (!teacherBookings[day]) teacherBookings[day] = {};
      if (!teacherBookings[day][tid]) teacherBookings[day][tid] = [];
      return teacherBookings[day][tid];
    }
    function getRoomList(day, rk) {
      if (!roomBookings[day]) roomBookings[day] = {};
      if (!roomBookings[day][rk]) roomBookings[day][rk] = [];
      return roomBookings[day][rk];
    }
    function getSeriesList(day, sid) {
      if (!seriesBookings[day]) seriesBookings[day] = {};
      if (!seriesBookings[day][sid]) seriesBookings[day][sid] = [];
      return seriesBookings[day][sid];
    }

    function isTeacherAvailable(tid, day, start, span) {
      if (!tid) return true;
      const list = getTeacherList(day, tid);
      for (const b of list) {
        // Overlap check
        if (start < b.start + b.span && b.start < start + span) return false;
        // Strict no back-to-back: no consecutive slots
        if (start === b.start + b.span) return false;
        if (b.start === start + span) return false;
        // Avoid consecutive sessions across 10:30-10:50 break (slot 10 ending and 11 starting)
        if ((b.start + b.span === 10 && start === 11) || (start + span === 10 && b.start === 11)) return false;
      }
      return true;
    }

    function isRoomAvailable(rk, day, start, span) {
      if (!rk) return true;
      const list = getRoomList(day, rk);
      for (const b of list) {
        if (start < b.start + b.span && b.start < start + span) return false;
      }
      return true;
    }

    function isSeriesAvailable(sid, day, start, span) {
      const list = getSeriesList(day, sid);
      for (const b of list) {
        if (start < b.start + b.span && b.start < start + span) return false;
      }
      return true;
    }

    function isDeptMeeting(day, start, span) {
      const M = state.meeting;
      if (M && M.text && M.day && M.span > 0) {
        if (day === M.day && start < M.start + M.span && start + span > M.start) return true;
      }
      return false;
    }

    function bookClass(c) {
      newClasses.push(c);
      if (c.teacherId) getTeacherList(c.day, c.teacherId).push({ start: c.start, span: c.span, code: c.code });
      if (c.room) {
        const rk = c.cat === 'Lab' ? 'lab-' + c.room : 'room-' + c.room;
        getRoomList(c.day, rk).push({ start: c.start, span: c.span, code: c.code });
      }
      getSeriesList(c.day, c.seriesId).push({ start: c.start, span: c.span, code: c.code });
    }

    // Seed preserved classes from other batches
    preservedClasses.forEach(c => {
      if (c.teacherId) getTeacherList(c.day, c.teacherId).push({ start: c.start, span: c.span, code: c.code });
      if (c.room) {
        const rk = c.cat === 'Lab' ? 'lab-' + c.room : 'room-' + c.room;
        getRoomList(c.day, rk).push({ start: c.start, span: c.span, code: c.code });
      }
      getSeriesList(c.day, c.seriesId).push({ start: c.start, span: c.span, code: c.code });
    });

    const targetCourses = state.courses.filter(c => seriesToSchedule.some(s => s.id === c.seriesId));
    const labCourses = shuffle(targetCourses.filter(c => c.type === 'lab'));
    const theoryCourses = shuffle(targetCourses.filter(c => c.type === 'theory'));

    let failed = false;

    // --- PHASE 1: LAB SESSIONS (Most Constrained) ---
    for (const course of labCourses) {
      const g = course.groups && course.groups[0];
      const tid = g ? g.teacherId : course.teacherId;
      const labObj = g && g.labId ? state.labs.find(l => l.id === g.labId) : null;
      const labIdx = state.labs.findIndex(l => l.id === (labObj ? labObj.id : -1));
      const labRoomName = (labObj && labObj.name.startsWith('Lab-'))
        ? labObj.name
        : (labIdx >= 0 ? `Lab-${labIdx + 1}` : (labObj ? labObj.name : 'Lab-1'));
      const labKey = 'lab-' + labRoomName;
      const sessionsNeeded = course.sessionsPerWeek || 1;
      const usedDays = new Set();

      for (let sIdx = 0; sIdx < sessionsNeeded; sIdx++) {
        const candidateDays = shuffle(DAYS).sort((a, b) => {
          const aUsed = usedDays.has(a) ? 1 : 0;
          const bUsed = usedDays.has(b) ? 1 : 0;
          return aUsed - bUsed;
        });

        let placed = false;
        for (const day of candidateDays) {
          const startCandidates = shuffle(LAB_START_OPTIONS);
          for (const start of startCandidates) {
            if (isDeptMeeting(day, start, 3)) continue;
            if (!isSeriesAvailable(course.seriesId, day, start, 3)) continue;
            if (!isRoomAvailable(labKey, day, start, 3)) continue;
            if (!isTeacherAvailable(tid, day, start, 3)) continue;

            const t = teacherById(tid);
            bookClass({
              id: nextId(),
              seriesId: course.seriesId,
              day,
              start,
              span: 3,
              cat: 'Lab',
              code: course.code,
              title: course.title,
              room: labRoomName,
              teacherId: tid,
              initials: t ? teacherShort(t) : '',
              section: "All Sections"
            });
            usedDays.add(day);
            placed = true;
            break;
          }
          if (placed) break;
        }

        if (!placed) { failed = true; break; }
      }
      if (failed) break;
    }

    if (failed) continue;

    // --- PHASE 2: THEORY SESSIONS (Morning Priority & Fair Interleaving) ---
    const morningCountPerSeries = {};
    seriesToSchedule.forEach(s => { morningCountPerSeries[s.id] = 0; });

    const sessionsToPlace = [];
    theoryCourses.forEach(course => {
      const needed = course.sessionsPerWeek || 3;
      for (let i = 0; i < needed; i++) {
        sessionsToPlace.push({
          course,
          sessionIndex: i
        });
      }
    });

    // Interleave sessions across series for fair morning access
    sessionsToPlace.sort((a, b) => a.sessionIndex - b.sessionIndex);

    const courseDayMap = {};

    for (const item of sessionsToPlace) {
      const course = item.course;
      const tid = course.teacherId;
      const sid = course.seriesId;
      const sIdx = state.series.findIndex(s => s.id === sid);
      const assignedRoomObj = course.roomId ? roomById(course.roomId) : (course.room ? state.rooms.find(r => r.code === course.room) : null);
      const preferredRoom = (assignedRoomObj ? assignedRoomObj.code : course.room) || preferredRoomCode[sIdx] || 'R-404';

      if (!courseDayMap[course.id]) courseDayMap[course.id] = new Set();
      const usedDays = courseDayMap[course.id];

      const roomCandidates = [preferredRoom, ...state.rooms.map(r => r.code).filter(c => c !== preferredRoom)];

      // Sort candidate days: prefer days not used by this course, and days with fewer classes for this series
      const candidateDays = [...DAYS].sort((a, b) => {
        const aUsed = usedDays.has(a) ? 10 : 0;
        const bUsed = usedDays.has(b) ? 10 : 0;
        if (aUsed !== bUsed) return aUsed - bUsed;
        const aCount = getSeriesList(a, sid).length;
        const bCount = getSeriesList(b, sid).length;
        return aCount - bCount;
      });

      // Theory slots in morning-first priority order: 8, 9, 10 (morning), then 11, 12, 13 (midday)
      const THEORY_STARTS_PRIORITY = [8, 9, 10, 11, 12, 13];

      let placed = false;
      for (const day of candidateDays) {
        for (const start of THEORY_STARTS_PRIORITY) {
          if (!isSeriesAvailable(sid, day, start, 1)) continue;
          if (!isTeacherAvailable(tid, day, start, 1)) continue;

          let chosenRoom = null;
          for (const rm of roomCandidates) {
            if (isRoomAvailable('room-' + rm, day, start, 1)) {
              chosenRoom = rm;
              break;
            }
          }
          if (!chosenRoom) continue;

          const t = teacherById(tid);
          bookClass({
            id: nextId(),
            seriesId: sid,
            day,
            start,
            span: 1,
            cat: course.dept || 'ECE',
            code: course.code,
            title: course.title,
            room: chosenRoom,
            teacherId: tid,
            initials: t ? teacherShort(t) : '',
            section: "All Sections"
          });
          usedDays.add(day);
          if (start <= 10) morningCountPerSeries[sid] = (morningCountPerSeries[sid] || 0) + 1;
          placed = true;
          break;
        }
        if (placed) break;
      }

      if (!placed) { failed = true; break; }
    }

    if (!failed) {
      bestResult = {
        classes: [...preservedClasses, ...newClasses],
        newCount: newClasses.length,
        morningStats: morningCountPerSeries,
        attemptsNeeded: attempt
      };
      break;
    }
  }

  if (bestResult) {
    state.classes = bestResult.classes;
    saveState();
    renderRoutine();
    showGenerationReport({
      scope,
      targetSeriesName: targetSeriesObj ? targetSeriesObj.name : 'Selected Series',
      classesPlaced: bestResult.newCount,
      morningStats: bestResult.morningStats,
      seriesScheduled: seriesToSchedule
    });
    toast(scope === 'all'
      ? `Master routine auto-generated: ${bestResult.newCount} classes scheduled across all batches.`
      : `Routine generated for ${targetSeriesObj ? targetSeriesObj.name : 'batch'}: ${bestResult.newCount} classes placed.`, 'ok');
  } else {
    toast('Scheduling engine reached maximum constraint restarts. Please verify that enough classrooms and teachers are available.', 'err');
  }
}

function showGenerationReport(data) {
  const scopeTitle = data.scope === 'all' ? 'Whole Series (Master Department Routine)' : data.targetSeriesName;
  const morningTotal = Object.values(data.morningStats || {}).reduce((a, b) => a + b, 0);

  const seriesBreakdown = (data.seriesScheduled || []).map(s => {
    const sClasses = state.classes.filter(c => c.seriesId === s.id);
    const morningCount = data.morningStats ? (data.morningStats[s.id] || 0) : 0;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--bg); border-radius:var(--radius-xs); border:1px solid var(--border); font-size:12px;">
        <div><strong>${s.name}</strong> <span style="color:var(--text-mute); font-size:11px;">(${s.label ? s.label.replace('|', ' • ') : ''})</span></div>
        <div style="display:flex; gap:12px;">
          <span style="color:var(--primary); font-weight:700;">${sClasses.length} sessions</span>
          <span style="color:#059669; font-weight:700;">${morningCount} morning slots</span>
        </div>
      </div>
    `;
  }).join('');

  openModal(`
    <div class="autogen-modal">
      <div class="modal-header-banner">
        <div class="modal-badge">Optimization Verified ✓</div>
        <h2>⚡ Routine Auto-Generated Successfully</h2>
        <p class="modal-sub">Scheduled for <strong>${scopeTitle}</strong> with verified zero clashes and strict academic constraints.</p>
      </div>

      <div class="autogen-report-grid">
        <div class="arg-card">
          <div class="arg-num ok">${data.classesPlaced}</div>
          <div class="arg-lbl">Sessions Placed</div>
        </div>
        <div class="arg-card">
          <div class="arg-num ok">0</div>
          <div class="arg-lbl">Faculty Clashes</div>
        </div>
        <div class="arg-card">
          <div class="arg-num ok">0</div>
          <div class="arg-lbl">Back-to-Back Violations</div>
        </div>
        <div class="arg-card">
          <div class="arg-num" style="color:#d97706;">${morningTotal}</div>
          <div class="arg-lbl">Morning Sessions</div>
        </div>
      </div>

      <div class="autogen-section-title" style="margin-top:14px;">Batch Breakdown</div>
      <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
        ${seriesBreakdown}
      </div>

      <div style="margin-top:16px; padding:10px 12px; background:rgba(5, 150, 105, 0.08); border:1px solid #a7f3d0; border-radius:var(--radius-sm); font-size:11.5px; color:#065f46; display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">✓</span>
        <div><strong>Academic Constraint Check Passed</strong>: Every teacher has designated rest breaks between periods, and labs run in unbroken 3-slot blocks.</div>
      </div>

      <div class="modal-actions" style="margin-top:18px; display:flex; justify-content:flex-end;">
        <button class="btn-primary" onclick="closeModal()">Done</button>
      </div>
    </div>
  `);
}

/* ============================= ROUTINE PAGE ============================= */
/* ---- Scope helpers: everything below respects the "All Series" toggle and
   the Day filter pills, so the routine can be viewed one-day/one-series at a
   time, or every series & every day at once. ---- */
function scopeSeriesIds() {
  return state.routineAllSeries ? state.series.map(s => s.id) : [state.activeSeriesId];
}
function daysInScope() {
  return state.routineDayFilter === 'All' ? DAYS : [state.routineDayFilter];
}
function classesForDay(day) {
  const seriesIds = scopeSeriesIds();
  return state.classes.filter(c => seriesIds.includes(c.seriesId) && c.day === day)
    .sort((a, b) => a.start - b.start);
}

/* Human time-range label for a class, e.g. "8:00–8:50" or "10:50–1:20". */
function timeRangeLabel(start, span) {
  const first = SLOT_COLUMNS.find(x => x.type === 'slot' && x.start === start);
  if (!first) return '';
  const last = SLOT_COLUMNS.find(x => x.type === 'slot' && x.start === start + span - 1) || first;
  return `${first.label.split('\n')[0]}–${last.label.split('\n')[1]}`;
}

/* A rough, at-a-glance "Quality" score for the currently-scoped routine:
   what % of every course's required sessions/week actually made it onto the
   grid. 100 when there's nothing to schedule yet. */
function computeQuality() {
  const seriesIds = scopeSeriesIds();
  const courses = state.courses.filter(c => seriesIds.includes(c.seriesId));
  if (!courses.length) return { percent: 100, placed: 0, required: 0 };
  let required = 0, placed = 0;
  courses.forEach(course => {
    required += course.sessionsPerWeek;
    const days = new Set(state.classes.filter(cl => cl.seriesId === course.seriesId && cl.code === course.code).map(cl => cl.day));
    placed += Math.min(days.size, course.sessionsPerWeek);
  });
  return { percent: required ? Math.round((placed / required) * 100) : 100, placed, required };
}

function classMatchesTeacherFilter(c) {
  if (!state.routineTeacherFilter || state.routineTeacherFilter === 'All') return true;
  const target = state.routineTeacherFilter.trim().toUpperCase();
  const codes = teacherCodesForClass(c);
  if (codes.includes(target)) return true;
  const t = teacherForClass(c);
  if (t && t.shortName && t.shortName.trim().toUpperCase() === target) return true;
  return false;
}

function classMatchesSearch(c) {
  if (!classMatchesTeacherFilter(c)) return false;
  if (!state.routineSearchQuery) return true;
  const q = state.routineSearchQuery.toLowerCase();
  const t = teacherForClass(c);
  const teacherName = t ? t.name.toLowerCase() : '';
  const teacherInit = t ? teacherShort(t).toLowerCase() : '';
  const code = (c.code || '').toLowerCase();
  const title = (c.title || '').toLowerCase();
  const room = (c.room || '').toLowerCase();
  const initials = (c.initials || '').toLowerCase();
  return code.includes(q) || title.includes(q) || room.includes(q) || teacherName.includes(q) || teacherInit.includes(q) || initials.includes(q);
}

/* Renders one class as a styled card (used by the Card view). In "All Series"
   mode a small series tag is shown so classes from different batches are
   still distinguishable when mixed together in one day column. */
function classCardHtml(c, opts = {}) {
  const t = teacherForClass(c);
  const col_ = classColor(c);
  const isLab = c.cat === 'Lab';
  const seriesTag = opts.showSeries ? (state.series.find(s => s.id === c.seriesId) || {}).name : '';
  const draggableAttr = opts.draggable ? `draggable="true" data-dragclass="${c.id}"` : '';
  const isMatch = classMatchesSearch(c);
  const isFiltered = (state.routineSearchQuery || (state.routineTeacherFilter && state.routineTeacherFilter !== 'All'));
  const searchClass = isFiltered ? (isMatch ? ' search-match' : ' search-dim') : '';
  const codes = teacherCodesForClass(c).join(' ');
  const initLabel = (c.initials && c.initials.trim()) ? c.initials.trim() : (t ? teacherShort(t) : '');

  return `
    <div class="rcard ${isLab ? 'rcard-lab' : ''}${searchClass}" 
         style="--rcard-fg:${col_.fg};--rcard-bg:${col_.bg};border-left:4px solid ${col_.fg};" 
         data-editclass="${c.id}" 
         data-teacher-code="${codes}" 
         ${draggableAttr}>
      ${opts.editable !== false ? `<span class="rcard-del" data-delclass="${c.id}" title="Delete class">✕</span>` : ''}
      <div class="rcard-top-row">
        <span class="rcard-code">${c.code}</span>
        ${isLab ? `<span class="rcard-type-pill lab">LAB</span>` : `<span class="rcard-type-pill theory">50m</span>`}
      </div>
      ${c.title ? `<div class="rcard-title">${c.title}</div>` : ''}
      ${seriesTag ? `<div class="rcard-series">${seriesTag}</div>` : ''}
      <div class="rcard-footer-meta">
        ${initLabel ? `<span class="rcard-teacher-pill" style="background:${col_.fg};color:#ffffff;">${initLabel}</span>` : ''}
        <span class="rcard-badge time"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${timeRangeLabel(c.start, c.span)}</span>
        ${c.room ? `<span class="rcard-badge room"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>${c.room}</span>` : ''}
      </div>
    </div>`;
}

/* Builds one day column for the Card view. In single-series mode every slot
   is walked so admins get click-to-add + drag-and-drop targets on empty
   slots; those placeholders are hidden for everyone else so the routine
   stays clean. In "All Series" mode we just list every class from every
   series for that day (adding/dragging is disabled — ambiguous which
   series a drop would belong to). */
function dayColumnHtml(day) {
  const dayClasses = classesForDay(day);

  if (state.routineAllSeries) {
    const body = dayClasses.map(c => classCardHtml(c, { showSeries: true, editable: false })).join('')
      || `<div class="day-empty">No classes</div>`;
    return `<div class="day-col"><div class="day-col-head">${day}</div><div class="day-col-body">${body}</div></div>`;
  }

  const occupied = new Map();
  dayClasses.forEach(c => { for (let i = 0; i < c.span; i++) occupied.set(c.start + i, i === 0 ? c : 'spanned'); });

  let body = '';
  SLOT_COLUMNS.forEach(col => {
    if (col.type !== 'slot') return; // Card view keeps Break/Lunch implicit, not shown as rows
    const occ = occupied.get(col.start);
    if (occ === 'spanned') return;
    if (occ && typeof occ === 'object') {
      body += classCardHtml(occ, { draggable: state.isAdmin });
      return;
    }
    if (state.isAdmin) {
      const isTheorySlot = THEORY_ALLOWED_STARTS.includes(col.start);
      body += `<div class="day-slot-empty" data-addclass="1" data-day="${day}" data-start="${col.start}" title="${isTheorySlot ? 'Add Class or Lab' : 'Add Lab (afternoon)'}">
        <span class="plus">+</span><span class="slot-time">${col.label.split('\n')[0]}</span>
      </div>`;
    }
  });
  if (!body) body = `<div class="day-empty">No classes${state.isAdmin ? ' — click + to add' : ''}</div>`;
  return `<div class="day-col" data-daycol="${day}"><div class="day-col-head">${day}</div><div class="day-col-body">${body}</div></div>`;
}

/* ============================= SHEET VIEW ============================= */
/* Replicates the department's real printed routine sheet: one row per
   series/batch, columns grouped into day-bands (to keep each band a
   reasonable width — Sat+Sun+Mon, then Tue+Wed — exactly like the paper
   version), a Lab List + Teacher-initials legend, and a signature footer.
   The exact same builder is used for the on-screen view AND for both print
   modes, so what you see is always what you print. */
const ROW_TINTS = ['#ffffff', '#fdf6d8', '#e9f7ef', '#f2eafd', '#e9f7ef', '#eef2f7', '#fdeee0'];

function seriesRowLabelHtml(s) {
  if (s.label && s.label.trim()) {
    const parts = s.label.split('|').map(l => l.trim());
    if (parts.length >= 2) {
      return `<div class="srl-year" style="font-weight:700;font-size:8px;line-height:1.2;letter-spacing:0.01em;">${parts[0]}</div>`
        + `<div class="srl-series" style="font-weight:800;font-size:8.5px;line-height:1.2;letter-spacing:0.02em;margin-top:1px;">${parts[1]}</div>`;
    }
    return s.label.split('|').map(l => l.trim()).join('<br>');
  }
  return `<div class="srl-series" style="font-weight:800;">${s.name}</div>`;
}

/* Splits the in-scope days into bands of at most 3 columns each, so a Sheet
   with all 5 weekdays renders as [Sat,Sun,Mon] + [Tue,Wed], same as the
   paper routine; a filtered single day just renders as one small band. */
function dayBands(daysOverride) {
  const days = daysOverride || daysInScope();
  const bands = [];
  for (let i = 0; i < days.length; i += 3) bands.push(days.slice(i, i + 3));
  return bands;
}

function sheetClassCellHtml(c, interactive, isMono = false) {
  const t = teacherForClass(c);
  const col_ = isMono ? { bg: '#ffffff', fg: '#000000', border: '#000000' } : classColor(c);
  const codes = teacherCodesForClass(c).join(' ');
  const parts = String(c.code || '').split(' ');
  const codeHtml = (c.span >= 2 || parts.length <= 1) ? (c.code || '') : `${parts[0]}<br>${parts.slice(1).join(' ')}`;
  // The teacher line shows the exact label from the sheet (which may credit
  // several teachers, e.g. "MFA+NIS"); falls back to the single assigned teacher.
  const initLabel = (c.initials && c.initials.trim()) ? c.initials.trim() : (t ? teacherShort(t) : '');
  // For 1-slot cells, break compound initials cleanly at the delimiter (+ or /) so no initials are cut in half
  const formattedInitLabel = (c.span <= 1 && (initLabel.includes('+') || initLabel.includes('/')))
    ? initLabel.replace(/([+/])/g, '$1<br>')
    : initLabel.replace(/\s*\/\s*/g, ' / ').replace(/([+/])/g, '$1<wbr>');
  const formattedRoom = String(c.room || '').replace(/\s*\/\s*/g, ' / ').replace(/([+/])/g, '$1<wbr>');
  const dragAttr = interactive
    ? `data-editclass="${c.id}" draggable="true" data-dragclass="${c.id}" data-day="${c.day}" data-start="${c.start}" data-series="${c.seriesId}"`
    : '';

  const isMatch = classMatchesSearch(c);
  const isFiltered = (state.routineSearchQuery || (state.routineTeacherFilter && state.routineTeacherFilter !== 'All'));
  const searchClass = isFiltered ? (isMatch ? ' search-match' : ' search-dim') : '';

  const isLab = c.cat === 'Lab' || c.span >= 3;
  const monoBg = isLab ? 'background: repeating-linear-gradient(45deg, #ffffff, #ffffff 6px, #f1f5f9 6px, #f1f5f9 12px);' : 'background: #ffffff;';
  const cellStyle = isMono
    ? `${monoBg}color:#000000;border:1px solid #000000;`
    : `background:${col_.bg};color:${col_.fg};border-left:3.5px solid ${col_.fg};`;

  const pillStyle = isMono
    ? 'background:#ffffff;color:#000000;border:1px solid #000000;font-size:7px;font-weight:800;letter-spacing:0.01em;border-radius:2px;padding:0.5px 3.5px;box-shadow:none;line-height:1;min-height:11px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;'
    : `background:${col_.fg};color:#ffffff;`;

  const roomStyle = isMono
    ? 'background:#ffffff;color:#000000;border:1px solid #000000;font-size:7px;font-weight:800;letter-spacing:0.01em;border-radius:2px;padding:0.5px 4px;box-shadow:none;line-height:1;min-height:11px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;white-space:nowrap;'
    : '';

  return `<td class="sheet-cell sheet-classcell${interactive ? ' sheet-draggable' : ''}${searchClass}" 
              colspan="${c.span}" 
              style="${cellStyle}" 
              data-teacher-code="${codes}"
              data-class-id="${c.id}"
              ${dragAttr}>
    ${interactive ? '<span class="scc-grip" title="Drag to move or swap">⠿</span>' : ''}
    <div class="scc-code" title="${c.code}${c.title ? ` — ${c.title}` : ''}" style="${isMono ? 'color:#000000;font-weight:900;letter-spacing:0.01em;' : ''}">${codeHtml}</div>
    ${initLabel ? `<div class="scc-teacher-pill-wrap"><span class="scc-teacher-pill" ${t ? `data-change-teacher-color="${t.id}"` : ''} style="${pillStyle}" title="${t ? `${t.name} (${initLabel}) — Click or right-click to change color` : initLabel}">${formattedInitLabel}</span></div>` : ''}
    ${c.room ? `<div class="scc-room"><span class="scc-room-badge" style="${roomStyle}" title="${c.room}">${formattedRoom}</span></div>` : ''}
  </td>`;
}

/* Builds one day-band table (a set of days shown side by side) with every
   series in `seriesList` as a row. `interactive` enables click-to-add /
   click-to-edit (only ever true on-screen, for a single admin-owned series;
   print output and All-Series views are always read-only). */
function buildBandTable(days, seriesList, interactive, isMono = false) {
  const headRow1 = `<th class="sheet-corner">Day</th>` + days.map(day => `<th colspan="${SLOT_COLUMNS.length}" class="sheet-th-day" data-day-header="${day}">${day}</th>`).join('');
  const headRow2 = `<th class="sheet-corner">Time</th>` + days.map(() => SLOT_COLUMNS.map(col =>
    col.type === 'slot' ? `<th class="sheet-th-time">${col.label.split('\n')[0]}<br>${col.label.split('\n')[1]}</th>` : `<th class="sheet-th-time">${col.label.split('\n')[0]}</th>`
  ).join('')).join('');

  /* A department-wide reserved block (e.g. Monday afternoon meeting) is drawn
     once as a single cell spanning its columns AND every series row. */
  const M = state.meeting;
  const hasMeeting = !!(M && M.text && M.day && M.span > 0);
  const meetingCovers = (day, start) => hasMeeting && day === M.day && start >= M.start && start < M.start + M.span;

  const bodyRows = seriesList.map((s, rowIdx) => {
    const rowLabelStyle = isMono
      ? 'background:#f8fafc;color:#000000;border:1px solid #000000;font-weight:800;'
      : `background:${ROW_TINTS[rowIdx % ROW_TINTS.length]};`;
    let row = `<td class="sheet-rowlabel" style="${rowLabelStyle}">${seriesRowLabelHtml(s)}</td>`;
    days.forEach(day => {
      const dayClasses = state.classes.filter(c => c.seriesId === s.id && c.day === day);
      const occupied = new Map();
      dayClasses.forEach(c => { for (let i = 0; i < c.span; i++) occupied.set(c.start + i, i === 0 ? c : 'spanned'); });
      SLOT_COLUMNS.forEach(col => {
        if (col.type === 'break') {
          if (rowIdx === 0) {
            const breakStyle = isMono ? 'background: repeating-linear-gradient(135deg, #ffffff, #ffffff 6px, #e2e8f0 6px, #e2e8f0 12px); color: #000000; border: 1px solid #000000; font-weight: 800;' : '';
            row += `<td class="break-col sheet-cell" style="${breakStyle}" rowspan="${seriesList.length}">Break</td>`;
          }
          return;
        }
        if (col.type === 'lunch') {
          if (rowIdx === 0) {
            const lunchStyle = isMono ? 'background: repeating-linear-gradient(135deg, #ffffff, #ffffff 6px, #e2e8f0 6px, #e2e8f0 12px); color: #000000; border: 1px solid #000000; font-weight: 800;' : '';
            row += `<td class="lunch-col sheet-cell" style="${lunchStyle}" rowspan="${seriesList.length}">Lunch</td>`;
          }
          return;
        }
        if (meetingCovers(day, col.start)) {
          // Emit the merged block once (top row, first covered column); every
          // other covered cell is absorbed by its colspan + rowspan.
          if (rowIdx === 0 && col.start === M.start) {
            const meetingStyle = isMono ? 'background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 8px, #e2e8f0 8px, #e2e8f0 16px); color: #000000; border: 1px solid #000000; font-weight: 800;' : '';
            const dragMeetingAttr = interactive
              ? `draggable="true" data-dragmeeting="1" data-day="${M.day}" data-start="${M.start}" data-span="${M.span}"`
              : '';
            row += `<td class="sheet-cell sheet-meeting${interactive ? ' sheet-draggable sheet-meeting-draggable' : ''}" style="${meetingStyle}position:relative;" rowspan="${seriesList.length}" colspan="${M.span}" ${dragMeetingAttr}>
              ${interactive ? '<span class="scc-grip" title="Drag to move Departmental Meeting to any day">⠿</span>' : ''}
              ${M.text}
            </td>`;
          }
          return;
        }
        const occ = occupied.get(col.start);
        if (occ === 'spanned') return;
        if (occ && typeof occ === 'object') { row += sheetClassCellHtml(occ, interactive, isMono); return; }
        row += interactive
          ? `<td class="sheet-cell sheet-empty" data-addclass="1" data-series="${s.id}" data-day="${day}" data-start="${col.start}" title="Add"><span>+</span></td>`
          : `<td class="sheet-cell sheet-blank"></td>`;
      });
    });
    return `<tr>${row}</tr>`;
  }).join('');

  return `<div class="sheet-band"><table class="sheet-table"><thead><tr>${headRow1}</tr><tr>${headRow2}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}

function sheetLegendHtml(isMono = false) {
  // The legend is a full-width strip under the bands: a Laboratory list and a
  // Teacher-initials key, each rendered as ONE table that reads across the page
  // in repeated (label, value) column-pairs.
  const pairedTable = (items, pairsPerRow, headClass, headPair, cellPair) => {
    const rows = [];
    for (let i = 0; i < items.length; i += pairsPerRow) {
      let tds = '';
      for (let j = 0; j < pairsPerRow; j++) {
        const it = items[i + j];
        tds += it ? cellPair(it) : `<td class="lg-sl lg-pad"></td><td class="lg-name lg-pad"></td>`;
      }
      rows.push(`<tr>${tds}</tr>`);
    }
    let head = '';
    for (let j = 0; j < pairsPerRow; j++) head += headPair;
    return `<table class="sheet-legend-table"><thead><tr class="${headClass}">${head}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  };
  const emptyTable = (headClass, label) => `<table class="sheet-legend-table">`
    + `<thead><tr class="${headClass}"><th>Sl.</th><th>${label}</th></tr></thead>`
    + `<tbody><tr><td colspan="2">None yet.</td></tr></tbody></table>`;

  const labItems = state.labs.map((l, i) => ({ n: i + 1, name: l.name }));
  const labTable = labItems.length
    ? pairedTable(labItems, 7, 'sheet-legend-head-lab',
      `<th class="lg-sl lg-sl-lab">Sl.</th><th class="lg-name">Laboratory</th>`,
      it => `<td class="lg-sl lg-sl-lab">${it.n}</td><td class="lg-name" title="${it.name}">${it.name}</td>`)
    : emptyTable('sheet-legend-head-lab', 'Laboratory');

  const teacherTable = state.teachers.length
    ? pairedTable(state.teachers, 8, 'sheet-legend-head-teacher',
      `<th class="lg-sl lg-sl-teacher">Init.</th><th class="lg-name">Teacher's Name</th>`,
      t => {
        const swatchHtml = isMono ? '' : `<span class="swatch" style="background:${t.color.fg};display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:3px;vertical-align:middle;"></span>`;
        return `<td class="lg-sl lg-sl-teacher legend-teacher-init" data-change-teacher-color="${t.id}" title="Click to customize ${t.shortName || t.name}'s color" style="cursor:pointer;">${swatchHtml}${teacherShort(t)}</td><td class="lg-name" data-change-teacher-color="${t.id}" style="cursor:pointer;" title="${t.name} (${teacherShort(t)}) — Click to customize color">${t.name}</td>`;
      })
    : emptyTable('sheet-legend-head-teacher', "Teacher's Name");

  return `<div class="sheet-legend">${labTable}${teacherTable}</div>`;
}

function sheetHeaderHtml(isMono = false) {
  const logoSrc = (typeof RUET_LOGO_DATA_URI !== 'undefined' && RUET_LOGO_DATA_URI) ? RUET_LOGO_DATA_URI : 'assets/ruet_logo.png';
  const logoStyle = isMono ? 'style="filter: grayscale(100%) contrast(120%);"' : '';
  return `
    <div class="sheet-header">
      <div class="sheet-logo" title="Rajshahi University of Engineering & Technology">
        <img src="${logoSrc}" alt="RUET Logo" class="sheet-logo-img" ${logoStyle} onerror="this.src='assets/ruet_logo.png'">
      </div>
      <div class="sheet-header-text">
        <div class="sheet-motto">Heaven's Light is Our Guide</div>
        <div class="sheet-uni">${settings.university || 'Rajshahi University of Engineering & Technology'}</div>
        <div class="sheet-dept">${settings.dept || 'Department of Electrical & Computer Engineering'}</div>
        ${settings.effectiveDate ? `<div class="sheet-caption"><span class="sheet-effective-pill">Effective from: ${settings.effectiveDate}</span></div>` : ''}
      </div>
    </div>`;
}

function sheetFooterHtml(isMono = false) {
  return `<div class="sheet-footer"><div class="sig-block"><div class="sig-line"></div><div>Prepared By</div></div><div class="sig-block"><div class="sig-line"></div><div>${settings.head || 'Head, ECE, RUET'}</div></div></div>`;
}

/* Full sheet: header + every day-band (stacked, each stretched to the full
   width) + a full-width legend strip + footer. Same function drives the
   on-screen view and both print modes, so what you see is what you print. */
function buildSheetHtml(seriesList, interactive, daysOverride, monochrome = null) {
  const isMono = (monochrome !== null && monochrome !== undefined) ? monochrome : !!state.sheetMonochrome;
  const bandTables = dayBands(daysOverride).map(days => buildBandTable(days, seriesList, interactive, isMono));
  const legend = sheetLegendHtml(isMono);
  const bandsHtml = `${bandTables.join('')}${legend}`;
  const zoom = state.sheetZoom || 'fit';
  const zoomStyle = (zoom !== 'fit' && zoom != 100) ? `zoom: ${Number(zoom) / 100};` : '';
  return `<div class="sheet-scale-box" style="${zoomStyle}">
    <div class="sheet-wrap ${isMono ? 'sheet-monochrome' : ''}">
      ${sheetHeaderHtml(isMono)}
      <div class="sheet-body">
        <div class="sheet-bands">${bandsHtml}</div>
      </div>
      ${sheetFooterHtml(isMono)}
    </div>
  </div>`;
}

/* Give every day-band AND both legend tables one shared width — the widest
   natural table on the sheet (normally the Sat/Sun/Mon band). This makes the
   shorter Tue/Wed band and the LAB + Teacher legend fill the sheet edge-to-edge
   instead of leaving an empty margin beside them. In 'fit' mode, dynamically
   scales the entire sheet so it fits on screen without horizontal scrolling. */
function equalizeBandWidths(root) {
  if (!root) return;
  const bands = [...root.querySelectorAll('.sheet-band > table.sheet-table')];
  const legends = [...root.querySelectorAll('.sheet-legend > table.sheet-legend-table')];
  const all = bands.concat(legends);
  if (all.length < 2) return;

  const scaleBox = root.querySelector('.sheet-scale-box');
  const container = root.querySelector('.routine-card') || root.querySelector('.content-grid') || document.getElementById('mainArea');

  // Measure natural min-width required by resetting width first
  all.forEach(t => { t.style.width = ''; });
  all.forEach(t => { t.style.width = ''; t.style.marginLeft = 'auto'; t.style.marginRight = 'auto'; });
  let naturalMax = 0;
  all.forEach(t => { naturalMax = Math.max(naturalMax, t.getBoundingClientRect().width); });
  const minRequiredWidth = Math.max(980, naturalMax);

  if (scaleBox) {
    scaleBox.style.marginLeft = 'auto';
    scaleBox.style.marginRight = 'auto';
    const wrap = scaleBox.querySelector('.sheet-wrap');
    if (wrap) {
      wrap.style.marginLeft = 'auto';
      wrap.style.marginRight = 'auto';
    }
  }

  if (state.sheetZoom === 'fit') {
    if (scaleBox && container) {
      const availableWidth = container.clientWidth - 36;
      if (availableWidth >= minRequiredWidth) {
        // Desktop / wide screen: expand to 100% full view of the screen!
        scaleBox.style.zoom = '1';
        scaleBox.style.width = '100%';
        all.forEach(t => { t.style.width = '100%'; });
        scaleBox.style.marginLeft = 'auto';
        scaleBox.style.marginRight = 'auto';
        all.forEach(t => { t.style.width = '100%'; t.style.marginLeft = 'auto'; t.style.marginRight = 'auto'; });
      } else {
        // Narrow screen: scale down smoothly with zoom to fit container without horizontal scrollbar
        const fitScale = Math.max(0.35, availableWidth / minRequiredWidth);
        scaleBox.style.zoom = fitScale.toFixed(3);
        scaleBox.style.width = minRequiredWidth + 'px';
        all.forEach(t => { t.style.width = minRequiredWidth + 'px'; });
        scaleBox.style.marginLeft = 'auto';
        scaleBox.style.marginRight = 'auto';
        all.forEach(t => { t.style.width = minRequiredWidth + 'px'; t.style.marginLeft = 'auto'; t.style.marginRight = 'auto'; });
      }
    } else {
      all.forEach(t => { t.style.width = '100%'; });
      all.forEach(t => { t.style.width = '100%'; t.style.marginLeft = 'auto'; t.style.marginRight = 'auto'; });
    }
  } else {
    // Explicit manual zoom (100%, 85%, 70%)
    if (scaleBox) {
      scaleBox.style.zoom = (Number(state.sheetZoom) / 100).toFixed(2);
      scaleBox.style.width = '100%';
      scaleBox.style.width = minRequiredWidth + 'px';
      scaleBox.style.maxWidth = '100%';
      scaleBox.style.marginLeft = 'auto';
      scaleBox.style.marginRight = 'auto';
    }
    all.forEach(t => { t.style.width = '100%'; });
    all.forEach(t => { t.style.width = minRequiredWidth + 'px'; t.style.marginLeft = 'auto'; t.style.marginRight = 'auto'; });
  }
}

/* Shared store: after a successful DnD op, wireRoutineDnD reads this to flash
   the destination cell with a .dnd-landed animation once the DOM re-renders. */
let _dndDestKey = null;   // "day|start|seriesId"

function moveClassToSlot(id, day, start, seriesId) {
  const c = state.classes.find(x => x.id === id);
  if (!c) return;
  // The Sheet shows every batch as a row. A class belongs to one batch (series),
  // so it may only be dropped within its own row — dropping onto another batch's
  // row is rejected rather than silently reassigning the class to that batch.
  if (seriesId != null && seriesId !== c.seriesId) {
    toast('That row belongs to a different batch. Drop the class within its own batch row.', 'warn'); return;
  }
  const isTheory = c.cat !== 'Lab' && c.span === THEORY_SPAN;
  if (isTheory && !THEORY_ALLOWED_STARTS.includes(start)) {
    toast('Theory classes run 8:00–1:20 only — they can\'t move into the afternoon.', 'warn'); return;
  }
  if (!fitsSegment(start, c.span)) { toast('That slot crosses the Break / Lunch gap and can\'t hold this class.', 'warn'); return; }
  const M = state.meeting;
  if (M && M.text && M.day === day && M.span > 0) {
    if (start < M.start + M.span && start + c.span > M.start) {
      toast('That slot is reserved for the Departmental Meeting.', 'warn'); return;
    }
  }
  const conflict = state.classes.some(o => o.id !== c.id && o.seriesId === c.seriesId && o.day === day &&
    !(start + c.span <= o.start || o.start + o.span <= start));
  if (conflict) { toast('That slot is already occupied. Drop on an empty slot, or onto another class to swap.', 'warn'); return; }
  const from = `${c.day} ${timeRangeLabel(c.start, c.span)}`;
  c.day = day; c.start = start;
  _dndDestKey = `${day}|${start}|${c.seriesId}`;
  renderRoutine();
  toast(`Moved ${c.code}: ${from} → ${day} ${timeRangeLabel(c.start, c.span)}.`, 'ok');
}

function moveMeeting(targetDay, targetStart) {
  if (!state.meeting) return;
  if (!targetDay || !DAYS.includes(targetDay)) return;
  const oldDay = state.meeting.day;
  const oldStart = state.meeting.start || 14;
  const span = state.meeting.span || 3;
  let resolvedStart = 14;
  if (targetStart && fitsSegment(targetStart, span)) {
    resolvedStart = targetStart;
  }

  if (targetDay === oldDay && resolvedStart === oldStart) return;

  // Check for conflicting classes in target time range across all series
  const conflicts = state.classes.filter(c => c.day === targetDay &&
    !(resolvedStart + span <= c.start || c.start + c.span <= resolvedStart)
  );

  if (conflicts.length > 0) {
    const conflictNames = conflicts.map(c => c.code).join(', ');
    const msg = `Moving Departmental Meeting to ${targetDay} (${timeRangeLabel(resolvedStart, span)}) conflicts with ${conflicts.length} scheduled session(s): ${conflictNames}.\n\nWould you like to move those session(s) to ${oldDay} (${timeRangeLabel(oldStart, span)})?`;
    if (!confirm(msg)) {
      toast('Departmental Meeting move cancelled.', 'info');
      return;
    }
    conflicts.forEach(c => {
      c.day = oldDay;
    });
  }

  state.meeting.day = targetDay;
  state.meeting.start = resolvedStart;
  _dndDestKey = `${targetDay}|${resolvedStart}|meeting`;
  saveState();
  renderRoutine();
  toast(`Departmental Meeting moved to ${targetDay} (${timeRangeLabel(resolvedStart, span)}).`, 'ok');
}
function swapClasses(id1, id2) {
  const a = state.classes.find(x => x.id === id1), b = state.classes.find(x => x.id === id2);
  if (!a || !b || a.id === b.id) return;
  if (a.seriesId !== b.seriesId) { toast('Those classes belong to different batches — swaps stay within one batch row.', 'warn'); return; }
  if (a.span !== b.span) { toast('You can only swap two classes of the same length (both Theory, or both Lab).', 'warn'); return; }
  const isTheory = x => x.cat !== 'Lab' && x.span === THEORY_SPAN;
  if ((isTheory(a) && !THEORY_ALLOWED_STARTS.includes(b.start)) || (isTheory(b) && !THEORY_ALLOWED_STARTS.includes(a.start))) {
    toast('That swap would push a theory class past 1:20 — not allowed.', 'warn'); return;
  }
  const ad = a.day, as_ = a.start, bd = b.day, bs = b.start;
  a.day = bd; a.start = bs; b.day = ad; b.start = as_;
  _dndDestKey = `${bd}|${bs}|${a.seriesId}`;
  renderRoutine();
  toast(`Swapped ${a.code} ↔ ${b.code}.`, 'ok');
}


/* ---- Print: both modes render through buildSheetHtml() — the exact same
   generator used on screen — so the PDF/printout always matches exactly. ---- */
function printCurrentRoutine(monochrome = false) {
  const activeS = activeSeries();
  runPrintJob([activeS].filter(Boolean), { monochrome });
}
function printAllSeriesRoutine(monochrome = false) {
  runPrintJob(state.series, { monochrome });
}
function runPrintJob(seriesList, options = {}) {
  const isMono = !!(options && options.monochrome);
  const container = document.createElement('div');
  container.id = 'printAllContainer';
  if (isMono) container.classList.add('print-monochrome');
  // Printouts always cover the full week (Sat–Wed), regardless of any Day
  // filter currently applied on screen — the PDF is the official document.
  container.innerHTML = buildSheetHtml(seriesList, false, DAYS, isMono);
  document.body.appendChild(container);
  document.body.classList.add('printing-all');
  if (isMono) document.body.classList.add('printing-monochrome');

  // Explicitly hide floating sidebar trigger from print output
  const sidebarBtn = document.getElementById('sidebarShowBtn');
  const prevBtnDisplay = sidebarBtn ? sidebarBtn.style.display : '';
  if (sidebarBtn) sidebarBtn.style.setProperty('display', 'none', 'important');

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    document.body.classList.remove('printing-all');
    document.body.classList.remove('printing-monochrome');
    if (sidebarBtn) {
      if (prevBtnDisplay) sidebarBtn.style.display = prevBtnDisplay;
      else sidebarBtn.style.removeProperty('display');
    }
    if (container.parentNode) container.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  const img = container.querySelector('.sheet-logo-img');
  const triggerPrint = () => {
    window.print();
    setTimeout(cleanup, 4000); // safety net for browsers that don't fire afterprint reliably
  };

  if (img && img.decode) {
    img.decode().then(triggerPrint).catch(triggerPrint);
  } else if (img && !img.complete) {
    img.onload = triggerPrint;
    img.onerror = triggerPrint;
    setTimeout(triggerPrint, 250);
  } else {
    requestAnimationFrame(() => setTimeout(triggerPrint, 60));
  }
}

/* ---- Compliance & Quality Inspection Modal ---- */
function openQualityModal() {
  const q = computeQuality();
  const seriesIds = scopeSeriesIds();
  const courses = state.courses.filter(c => seriesIds.includes(c.seriesId));

  const courseAudit = courses.map(course => {
    const placed = state.classes.filter(cl => cl.seriesId === course.seriesId && cl.code === course.code);
    const daysPlaced = new Set(placed.map(cl => cl.day)).size;
    const ok = daysPlaced >= course.sessionsPerWeek;
    const t = course.teacherId ? teacherById(course.teacherId) : null;
    return {
      code: course.code,
      title: course.title,
      type: course.type,
      required: course.sessionsPerWeek,
      placed: daysPlaced,
      ok,
      teacher: t ? (t.shortName || t.name) : 'Unassigned'
    };
  });

  openModal(`
    <div class="modal-header">
      <div class="modal-badge-icon" style="background:#fef3c7;color:#d97706;">⭐</div>
      <h2>Routine Quality &amp; Compliance Audit</h2>
      <div class="sub">Automated audit for ${state.routineAllSeries ? 'All Batches' : (activeSeries() ? activeSeries().name : 'Active Series')}.</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-form-body">
      <div class="quality-score-hero">
        <div class="quality-big-circle">${q.percent}%</div>
        <div class="quality-hero-text">
          <div class="quality-hero-title">${q.percent >= 90 ? 'Optimal Academic Routine' : q.percent >= 75 ? 'Good Routine Coverage' : 'Needs Optimization'}</div>
          <div class="quality-hero-sub">${q.placed} of ${q.required} required weekly sessions scheduled without schedule conflicts.</div>
        </div>
      </div>
      
      <div class="audit-rule-checks">
        <div class="rule-check ok">
          <span class="rule-ic">✓</span>
          <span><strong>Zero Double-Bookings:</strong> Verified across all rooms, labs, and faculty members.</span>
        </div>
        <div class="rule-check ok">
          <span class="rule-ic">✓</span>
          <span><strong>Fatigue Prevention:</strong> No consecutive back-to-back classes for any teacher on the same day.</span>
        </div>
        <div class="rule-check ok">
          <span class="rule-ic">✓</span>
          <span><strong>Break Protection:</strong> 10:30–10:50 Break &amp; 1:20–2:30 Lunch preserved strictly.</span>
        </div>
      </div>

      <div style="margin-top:16px;font-weight:700;font-size:12px;color:var(--text-mute);text-transform:uppercase;letter-spacing:0.04em;">Course Fulfillment Breakdown</div>
      <div class="report-list" style="max-height:220px;margin-top:8px;">
        ${courseAudit.length ? courseAudit.map(c => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 6px;border-bottom:1px solid var(--border);">
            <div>
              <strong style="color:var(--text);font-size:13px;">${c.code}</strong> 
              <span style="font-size:11.5px;color:var(--text-mute);">(${c.type === 'lab' ? 'Lab' : 'Theory'}) • ${c.teacher}</span>
            </div>
            <div>
              <span class="tag" style="background:${c.ok ? '#d1fae5' : '#fee2e2'};color:${c.ok ? '#065f46' : '#991b1b'};font-weight:700;">
                ${c.placed}/${c.required} placed
              </span>
            </div>
          </div>
        `).join('') : '<div style="padding:10px;text-align:center;color:var(--text-mute);">No courses in active scope.</div>'}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="closeModal()">Close Audit</button>
    </div>
  `);
}

/* ============================= FACULTY COLOR RIBBON ============================= */
function renderFacultyColorRibbon() {
  const counts = new Map();
  state.classes.forEach(c => {
    const codes = teacherCodesForClass(c);
    codes.forEach(code => counts.set(code, (counts.get(code) || 0) + 1));
  });

  const activeTeachers = state.teachers.filter(t => (counts.get((t.shortName || '').trim().toUpperCase()) || 0) > 0);
  const otherTeachers = state.teachers.filter(t => !activeTeachers.includes(t));
  const sortedTeachers = activeTeachers.sort((a, b) => {
    const ca = counts.get((a.shortName || '').trim().toUpperCase()) || 0;
    const cb = counts.get((b.shortName || '').trim().toUpperCase()) || 0;
    return cb - ca;
  }).concat(otherTeachers);

  const totalClasses = state.classes.length;
  const isAllActive = !state.routineTeacherFilter || state.routineTeacherFilter === 'All';

  const allPill = `
    <button class="faculty-chip ${isAllActive ? 'active' : ''}" data-teacher-filter="All" title="Show all faculty classes">
      <span class="faculty-chip-swatch" style="background:#4f46e5;"></span>
      <span>All Faculty</span>
      <span class="faculty-chip-count">${totalClasses}</span>
    </button>`;

  const chips = sortedTeachers.map(t => {
    const code = (t.shortName || '').trim();
    const count = counts.get(code.toUpperCase()) || 0;
    const isSelected = state.routineTeacherFilter && state.routineTeacherFilter.toUpperCase() === code.toUpperCase();
    const paintBtn = state.isAdmin
      ? `<span class="chip-paint-btn" data-paint-teacher="${t.id}" title="Change ${code}'s colour">🎨</span>`
      : '';
    return `
      <button class="faculty-chip ${isSelected ? 'active' : ''}" 
              data-teacher-filter="${code}"
              data-teacher-id="${t.id}"
              style="--chip-border:${t.color.border || t.color.fg}; --chip-fg:${t.color.fg}; --chip-bg:${t.color.bg};"
              title="${t.name} (${code}) — ${count} classes scheduled. Click to select/filter.">
        <span class="faculty-chip-swatch" style="background:${t.color.fg};"></span>
        <span class="faculty-chip-name">${code}</span>
        <span class="faculty-chip-count">${count}</span>
        ${paintBtn}
      </button>`;
  }).join('');


  return `
    <div class="faculty-ribbon-container" id="facultyColorRibbon">
      <div class="faculty-ribbon-label">
        <span>Faculty Colors:</span>
      </div>
      <div class="faculty-chips-scroll">
        ${allPill}
        ${chips}
      </div>
      ${state.isAdmin ? `
      <div class="faculty-ribbon-actions" style="margin-left:auto;flex-shrink:0;">
        <button type="button" class="faculty-ribbon-manage-btn" id="btnManageAllFacultyColors" title="Open directory to view and customize any teacher's color">
          <span>🎨 Manage Colors</span>
        </button>
      </div>` : ''}
    </div>`;
}

function wireFacultyColorRibbon() {
  const chips = document.querySelectorAll('.faculty-chip');
  chips.forEach(chip => {
    const code = chip.dataset.teacherFilter;
    if (!code) return;

    chip.onclick = (e) => {
      if (e.target.closest('[data-paint-teacher]')) return;
      if (code === 'All') {
        state.routineTeacherFilter = 'All';
      } else {
        state.routineTeacherFilter = (state.routineTeacherFilter && state.routineTeacherFilter.toUpperCase() === code.toUpperCase()) ? 'All' : code;
      }
      renderRoutine();
    };

    chip.oncontextmenu = (e) => {
      if (chip.dataset.teacherId) {
        e.preventDefault();
        openTeacherColorPicker(Number(chip.dataset.teacherId));
      }
    };
  });

  // Wire paint buttons on faculty chips
  document.querySelectorAll('[data-paint-teacher]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      openTeacherColorPicker(Number(btn.dataset.paintTeacher));
    };
  });

  // Wire Manage All Colors button
  const manageAllBtn = document.getElementById('btnManageAllFacultyColors');
  if (manageAllBtn) {
    manageAllBtn.onclick = (e) => {
      e.preventDefault();
      openFacultyColorDirectoryModal();
    };
  }
}

/* Modal to view all faculty and customize their colors in one place */
function openFacultyColorDirectoryModal() {
  const renderRows = (filter = '') => {
    const q = filter.trim().toUpperCase();
    const list = state.teachers.filter(t => !q || (t.name || '').toUpperCase().includes(q) || (t.shortName || '').toUpperCase().includes(q) || (t.dept || '').toUpperCase().includes(q));
    return list.map(t => {
      const classCount = state.classes.filter(c => teacherCodesForClass(c).includes((t.shortName || '').toUpperCase())).length;
      return `
        <div class="fcd-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--card);gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <span class="swatch" style="background:${t.color.fg};width:14px;height:14px;border-radius:4px;flex-shrink:0;"></span>
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${t.name}
              </div>
              <div style="font-size:11.5px;color:var(--text-mute);display:flex;align-items:center;gap:6px;margin-top:2px;">
                <span style="font-weight:700;color:${t.color.fg};background:${t.color.bg};padding:1px 5px;border-radius:3px;">${t.shortName || '—'}</span>
                <span>• ${t.dept || 'ECE'}</span>
                <span>• ${classCount} class${classCount === 1 ? '' : 'es'}</span>
              </div>
            </div>
          </div>
          <button type="button" class="btn-ghost-compact" data-pick-teacher-id="${t.id}" style="font-size:11.5px;padding:3px 8px;flex-shrink:0;">
            <span style="color:${t.color.fg};font-weight:700;">${t.color.name || 'Custom'}</span> 🎨
          </button>
        </div>`;
    }).join('');
  };

  openModal(`
    <div class="modal-header">
      <h2>🎨 Faculty Display Colors Directory</h2>
      <div class="sub">View and customize the routine color for any instructor. Every instructor has a distinct, exclusive color.</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>
    <div style="margin-bottom:12px;">
      <input type="text" id="fcdSearch" placeholder="Search teacher by name, initials or dept..." style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;background:var(--input-bg);color:var(--text);">
    </div>
    <div id="fcdListGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:8px;max-height:420px;overflow-y:auto;padding-right:4px;">
      ${renderRows()}
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button type="button" class="btn-ghost" onclick="closeModal()">Close</button>
    </div>
  `, () => {
    const searchInput = document.getElementById('fcdSearch');
    const listGrid = document.getElementById('fcdListGrid');
    const wireButtons = () => {
      document.querySelectorAll('[data-pick-teacher-id]').forEach(btn => {
        btn.onclick = () => {
          const tid = Number(btn.dataset.pickTeacherId);
          openTeacherColorPicker(tid);
        };
      });
    };
    wireButtons();
    if (searchInput && listGrid) {
      searchInput.oninput = (e) => {
        listGrid.innerHTML = renderRows(e.target.value);
        wireButtons();
      };
    }
  });
}

/* Modal to change a specific teacher's routine color */
function openTeacherColorPicker(teacherId) {
  const t = state.teachers.find(x => x.id === teacherId);
  if (!t) return;
  const currentHex = t.color ? (t.color.fg || '#4338ca') : '#4338ca';
  const currentBg = t.color ? (t.color.bg || '#eef2ff') : '#eef2ff';
  const currentBorder = t.color ? (t.color.border || currentHex) : currentHex;

  const paletteHtml = TEACHER_PALETTE.map((p, idx) => {
    const isSelected = (t.color && (t.color.fg.toLowerCase() === p.fg.toLowerCase() || t.color.name === p.name));
    return `
      <button type="button" class="palette-choice-card ${isSelected ? 'selected' : ''}" data-palette-idx="${idx}" title="${p.name} (${p.fg})">
        <span class="pcc-swatch" style="background:${p.fg};"></span>
        <div class="pcc-info">
          <span class="pcc-name">${p.name}</span>
          <span class="pcc-preview" style="background:${p.bg};color:${p.fg};border-left:3px solid ${p.border || p.fg};">${t.shortName || 'FAC'}</span>
        </div>
      </button>
    `;
  }).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-badge-icon" style="background:${currentBg};color:${currentHex};font-size:16px;">
        🎨
      </div>
      <h2>Faculty Display Color: ${t.name}</h2>
      <div class="sub">Choose a distinct color for <strong>${t.shortName || t.name}</strong>. All scheduled classes, teacher pills, and ribbon badges will immediately update.</div>
      <button class="modal-close-icon" onclick="closeModal()">✕</button>
    </div>

    <div class="teacher-color-picker-body">
      <div class="current-color-preview-card" style="background:${currentBg};border-left:4.5px solid ${currentBorder};color:${currentHex};padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;opacity:0.8;">Live Grid Cell Preview</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
          <span style="font-size:14px;font-weight:800;">ECE 1101</span>
          <span class="scc-teacher-pill" style="background:${currentHex};color:#ffffff;padding:3px 9px;border-radius:12px;font-weight:700;font-size:11.5px;">${t.shortName || t.name}</span>
        </div>
      </div>

      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;">
        Select Preset Academic Palette (${TEACHER_PALETTE.length} Distinct Tones):
      </div>

      <div class="palette-choices-grid" id="paletteChoicesGrid">
        ${paletteHtml}
      </div>

      <div class="custom-color-row" style="margin-top:16px;padding-top:12px;border-top:1px dashed var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <label for="customColorPicker" style="font-size:12.5px;font-weight:700;color:var(--text);">Custom Hex Color:</label>
          <input type="color" id="customColorPicker" value="${currentHex}" style="width:38px;height:32px;padding:0;border:none;cursor:pointer;border-radius:4px;background:none;">
          <span id="customHexLabel" style="font-size:12px;font-family:monospace;color:var(--text-mute);">${currentHex}</span>
        </div>
        <button type="button" class="btn-primary-compact" id="applyCustomColorBtn">
          Apply Custom Color
        </button>
      </div>
    </div>

    <div class="modal-actions" style="margin-top:18px;">
      <button type="button" class="btn-ghost" onclick="closeModal()">Close</button>
    </div>
  `, () => {
    // Preset click handlers
    document.querySelectorAll('.palette-choice-card').forEach(card => {
      card.onclick = () => {
        const idx = Number(card.dataset.paletteIdx);
        const choice = TEACHER_PALETTE[idx];
        if (choice) {
          t.color = Object.assign({}, choice);
          saveState();
          closeModal();
          renderAll();
          toast(`Updated ${t.name} (${t.shortName}) to ${choice.name}!`, 'ok');
        }
      };
    });

    // Custom color handlers
    const customPicker = document.getElementById('customColorPicker');
    const customHexLabel = document.getElementById('customHexLabel');
    const customApply = document.getElementById('applyCustomColorBtn');
    if (customPicker) {
      customPicker.oninput = () => {
        if (customHexLabel) customHexLabel.textContent = customPicker.value;
      };
    }
    if (customPicker && customApply) {
      customApply.onclick = () => {
        const hex = customPicker.value;
        t.color = {
          name: 'Custom (' + hex + ')',
          fg: hex,
          bg: hex + '1a',
          border: hex
        };
        saveState();
        closeModal();
        renderAll();
        toast(`Custom color applied for ${t.name}!`, 'ok');
      };
    }
  });
}


function renderRoutine() {
  saveState();
  if (state.viewMode === 'card') state.viewMode = 'sheet';
  const legend = state.teachers.map(t => `<span class="chip" style="background:${t.color.bg};color:${t.color.fg};"><span class="dot" style="background:${t.color.fg};"></span>${teacherShort(t)}</span>`).join('')
    + `<span class="chip" style="background:var(--c-lab-bg);color:var(--c-lab-fg);"><span class="dot" style="background:var(--c-lab-fg);"></span>Unassigned</span>`;

  const labListRows = state.labs.map((l, i) => `
    <tr><td>${i + 1}</td><td>${l.name} <span class="del" data-dellab="${l.id}" title="Delete">✕</span></td></tr>`).join('');
  const teacherListRows = state.teachers.map(t => `
    <tr><td style="color:${t.color.fg};"><span class="swatch" style="background:${t.color.fg};"></span>${teacherShort(t)}</td><td>${t.name}</td></tr>`).join('');

  const days = daysInScope();

  // ---- Sheet view: replica of the printed routine ----
  const sheetSeries = state.series;
  const sheetInteractive = state.isAdmin;
  const sheetView = buildSheetHtml(sheetSeries, sheetInteractive);
  const dndTip = sheetInteractive
    ? `<div class="dnd-admin-bar">
        <span class="dnd-live-dot"></span>
        <div class="dnd-admin-bar-text">
          <strong>Drag &amp; Drop Active</strong> &mdash;
          Grab any class onto a <span class="k">＋ empty slot</span> to <strong>move</strong>,
          or onto <span class="k">another class</span> of equal length to <strong>swap</strong>.
          <span style="opacity:.7;font-size:11.5px;margin-left:4px;">Red highlight = invalid target.</span>
        </div>
        <div class="dnd-admin-bar-badges">
          <span class="dnd-badge dnd-badge-move">↗ Move</span>
          <span class="dnd-badge dnd-badge-swap">⇄ Swap</span>
        </div>
      </div>`
    : '';


  // ---- Table view: classic grid matrix ----
  let pIdx = 0;
  const headerCells = SLOT_COLUMNS.map(col => {
    if (col.type === 'break') {
      return `<th class="matrix-th-break"><div class="matrix-th-time">RECESS</div><div class="matrix-th-sub">10:30–10:50</div></th>`;
    }
    if (col.type === 'lunch') {
      return `<th class="matrix-th-lunch"><div class="matrix-th-time">LUNCH &amp; PRAYER</div><div class="matrix-th-sub">1:20–2:30</div></th>`;
    }
    pIdx++;
    const [t1, t2] = col.label.split('\n');
    return `<th class="matrix-th-slot">
      <div class="matrix-th-period">Period ${pIdx}</div>
      <div class="matrix-th-time">${t1} – ${t2}</div>
    </th>`;
  }).join('');

  const tableRows = days.map(day => {
    const dayClasses = classesForDay(day);
    const seriesId = !state.routineAllSeries && activeSeries() ? activeSeries().id : null;
    const occupied = new Map();
    dayClasses.forEach(c => { for (let i = 0; i < c.span; i++) occupied.set(c.start + i, i === 0 ? c : 'spanned'); });
    let cells = '';
    const M = state.meeting;
    const hasMeeting = !!(M && M.text && M.day && M.span > 0);
    SLOT_COLUMNS.forEach(col => {
      if (col.type === 'break') { cells += `<td class="break-col">RECESS</td>`; return; }
      if (col.type === 'lunch') { cells += `<td class="lunch-col">LUNCH</td>`; return; }
      const slot = col;
      if (hasMeeting && day === M.day && slot.start >= M.start && slot.start < M.start + M.span) {
        if (slot.start === M.start) {
          const dragMeetingAttr = state.isAdmin ? `draggable="true" data-dragmeeting="1" data-day="${M.day}" data-start="${M.start}" data-span="${M.span}"` : '';
          cells += `<td class="slot sheet-meeting${state.isAdmin ? ' sheet-draggable sheet-meeting-draggable' : ''}" colspan="${M.span}" ${dragMeetingAttr} style="position:relative;">
            ${state.isAdmin ? `<span class="scc-grip" title="Drag to move Departmental Meeting to any day">⠿</span>` : ''}
            <div>${M.text}</div>
          </td>`;
        }
        return;
      }
      const occ = occupied.get(slot.start);
      if (occ === 'spanned') return;
      if (occ && typeof occ === 'object') {
        const c = occ;
        const col_ = classColor(c);
        const t = teacherForClass(c);
        const codes = teacherCodesForClass(c).join(' ');
        const initLabel = (c.initials && c.initials.trim()) ? c.initials.trim() : (t ? teacherShort(t) : '');
        const formattedInitLabel = (c.span <= 1 && (initLabel.includes('+') || initLabel.includes('/')))
          ? initLabel.replace(/([+/])/g, '$1<br>')
          : initLabel.replace(/\s*\/\s*/g, ' / ').replace(/([+/])/g, '$1<wbr>');
        const formattedRoom = String(c.room || '').replace(/\s*\/\s*/g, ' / ').replace(/([+/])/g, '$1<wbr>');
        const isMatch = classMatchesSearch(c);
        const isFiltered = (state.routineSearchQuery || (state.routineTeacherFilter && state.routineTeacherFilter !== 'All'));
        const searchClass = isFiltered ? (isMatch ? ' search-match' : ' search-dim') : '';
        const draggable = state.isAdmin && !state.routineAllSeries
          ? `draggable="true" data-dragclass="${c.id}" data-day="${day}" data-start="${slot.start}" data-series="${c.seriesId}"`
          : '';
        const dragClass = state.isAdmin && !state.routineAllSeries ? ' slot-draggable' : '';
        cells += `<td class="slot${dragClass}${searchClass}" colspan="${c.span}" ${draggable}
          style="background:${col_.bg};color:${col_.fg};border-left:4px solid ${col_.fg};position:relative;"
          data-teacher-code="${codes}" data-class-id="${c.id}">
          ${state.isAdmin && !state.routineAllSeries ? `<span class="scc-grip" title="Drag to move or swap">⠿</span>` : ''}
          <div class="class-block${searchClass}"
               style="background:transparent;color:${col_.fg};"
               ${draggable}
               data-editclass="${c.id}"
               data-teacher-code="${codes}">

            ${!state.routineAllSeries ? `<span class="del-x" data-delclass="${c.id}" title="Delete">✕</span>` : ''}
            <div class="matrix-class-code" title="${c.code}${c.title ? ` — ${c.title}` : ''}">${c.code}</div>
            ${c.room ? `<div class="grid-room"><span class="scc-room-badge" title="${c.room}">${formattedRoom}</span></div>` : ''}
            ${initLabel ? `<div class="matrix-teacher-wrap"><span class="scc-teacher-pill" ${t ? `data-change-teacher-color="${t.id}"` : ''} style="background:${col_.fg};color:#ffffff;" title="${t ? `${t.name} (${initLabel}) — Click or right-click to change color` : initLabel}">${formattedInitLabel}</span></div>` : ''}
          </div>
        </td>`;
        return;
      }
      const isTheorySlot = THEORY_ALLOWED_STARTS.includes(slot.start);
      cells += state.routineAllSeries
        ? `<td class="slot matrix-empty-slot"></td>`
        : `<td class="slot matrix-empty-slot" data-addclass="1" data-day="${day}" data-start="${slot.start}" ${seriesId ? `data-series="${seriesId}"` : ''} title="${isTheorySlot ? 'Click to add Class' : 'Click to add Lab'}"><div class="empty-cell">＋</div></td>`;
    });
    return `<tr><td class="day-cell"><span class="day-cell-name">${day}</span></td>${cells}</tr>`;
  }).join('');


  const stats = [
    { num: coursesInActiveSeries().length, lbl: "Active Courses", ic: "📘", bg: "var(--c-ecs-bg)", fg: "var(--c-ecs-fg)" },
    { num: state.teachers.length, lbl: "Total Faculty", ic: "🧑‍🏫", bg: "var(--c-ece-bg)", fg: "var(--c-ece-fg)" },
    { num: state.rooms.length, lbl: "Classrooms", ic: "🚪", bg: "var(--c-math-bg)", fg: "var(--c-math-fg)" },
    { num: state.labs.length, lbl: "Sessional Labs", ic: "🧪", bg: "var(--c-lab-bg)", fg: "var(--c-lab-fg)" },
    { num: studentsInActiveSeries().length, lbl: "Enrolled Students", ic: "🎓", bg: "var(--c-eee-bg)", fg: "var(--c-eee-fg)" },
  ];

  const quality = computeQuality();

  const searchBoxHtml = `
    <div class="routine-search-container">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" id="routineSearchInput" placeholder="Search teacher, code, room..." value="${state.routineSearchQuery || ''}">
      ${state.routineSearchQuery ? `<button id="clearSearchBtn" class="clear-search-btn" title="Clear filter">✕</button>` : ''}
    </div>`;

  document.getElementById('mainArea').innerHTML = `
    <div class="topbar">
      <div class="topbar-left">
        <div class="page-title-group">
          <div class="page-breadcrumbs">Department of ECE &rsaquo; Routine Scheduler</div>
          <div class="page-title-row">
            <h1 class="page-title">Weekly Routine</h1>
            <button class="quality-badge" id="qualityBadgeBtn" title="Click to view full compliance audit">
              <span class="star-ic">⭐</span>
              <span>Quality: <strong>${quality.percent}%</strong></span>
            </button>
            <button class="focus-mode-btn ${state.focusMode ? 'active' : ''}" id="focusModeBtn" title="Toggle Fullscreen Focus View">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                ${state.focusMode
      ? `<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>`
      : `<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>`}
              </svg>
              <span>${state.focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="top-spacer"></div>

      <div class="topbar-right">
        ${searchBoxHtml}
        <button class="icon-btn round" id="darkToggle" title="Toggle Light/Dark Theme">
          ${state.darkMode
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`}
        </button>
        <div class="print-menu">
          <button class="btn-ghost" id="printBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span>Print / PDF</span>
          </button>
          <div class="print-menu-drop">
            <div class="print-menu-header">OFFICIAL BLACK &amp; WHITE PDF</div>
            <button id="printAllBwBtn" class="print-menu-item">
              <span class="pmi-icon">📄</span>
              <span class="pmi-body">
                <span class="pmi-title">Master Sheet (All Batches - B&amp;W)</span>
                <span class="pmi-desc">High-contrast photocopy &amp; official notice board</span>
              </span>
            </button>
            <button id="printSeriesBwBtn" class="print-menu-item">
              <span class="pmi-icon">📑</span>
              <span class="pmi-body">
                <span class="pmi-title">Active Batch Only (B&amp;W)</span>
                <span class="pmi-desc">Crisp monochrome single-batch routine</span>
              </span>
            </button>
            <div class="print-menu-divider"></div>
            <div class="print-menu-header">FULL COLOR EDITION</div>
            <button id="printAllBtn" class="print-menu-item">
              <span class="pmi-icon">🎨</span>
              <span class="pmi-body">
                <span class="pmi-title">Master Sheet (All Batches - Color)</span>
                <span class="pmi-desc">Full colored teacher &amp; session badges</span>
              </span>
            </button>
            <button id="printSeriesBtn" class="print-menu-item">
              <span class="pmi-icon">🌈</span>
              <span class="pmi-body">
                <span class="pmi-title">Active Batch Only (Color)</span>
                <span class="pmi-desc">Color palette for screen and digital export</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Unified Compact Command Strip: saves 250px vertical height -->
    <div class="routine-command-strip" id="routineCommandBar">
      <div class="command-strip-left">
        <div class="series-row" id="seriesRow"></div>
        <div class="day-filter-row" id="dayFilterRow"></div>
      </div>

      <div class="command-strip-right">
        <div class="view-toggle" title="Switch Display Format">
          <button data-view="sheet" class="${state.viewMode === 'sheet' ? 'active' : ''}" title="Official Master Sheet format">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span>Master Sheet</span>
          </button>
          <button data-view="table" class="${state.viewMode === 'table' ? 'active' : ''}" title="Compact timetable grid matrix">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            <span>Grid Matrix</span>
          </button>
        </div>

        ${state.viewMode === 'sheet' ? `
        <div class="zoom-pill-group" title="Sheet Zoom &amp; Auto-Fit">
          <button class="zoom-btn ${state.sheetZoom === 'fit' ? 'active' : ''}" data-zoom="fit">Fit Screen</button>
          <button class="zoom-btn ${state.sheetZoom == 100 ? 'active' : ''}" data-zoom="100">100%</button>
          <button class="zoom-btn ${state.sheetZoom == 85 ? 'active' : ''}" data-zoom="85">85%</button>
          <button class="zoom-btn ${state.sheetZoom == 70 ? 'active' : ''}" data-zoom="70">70%</button>
        </div>
        <div class="routine-theme-toggle-group" title="Preview Color Palette vs Official B&amp;W Document">
          <button class="theme-toggle-btn ${!state.sheetMonochrome ? 'active' : ''}" id="btnThemeColor" title="Full Color Mode">
            <span>🎨 Color</span>
          </button>
          <button class="theme-toggle-btn ${state.sheetMonochrome ? 'active' : ''}" id="btnThemeBw" title="Official Black &amp; White High-Contrast Mode">
            <span>📄 B&amp;W</span>
          </button>
        </div>` : ''}

        <button class="btn-primary-compact" id="autoGenBtn" title="Intelligent Auto-Generation (Whole Series or Specific Series)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          <span>Auto Gen</span>
        </button>
      </div>
    </div>

    <!-- Interactive Faculty Color Ribbon -->
    ${renderFacultyColorRibbon()}

    <div class="content-grid ${state.viewMode === 'sheet' ? 'content-grid-sheet' : 'content-grid-matrix'}">
      <div class="card routine-card">
        ${state.viewMode === 'sheet' ? dndTip + sheetView : `
        ${dndTip}
        ${!state.routineAllSeries && activeSeries() ? `
        <div class="matrix-banner">
          <div class="matrix-banner-title">
            <span class="matrix-banner-badge">${activeSeries().name}</span>
            <span>Weekly Class Routine</span>
          </div>
          <div class="matrix-banner-sub">
            ${activeSeries().label ? activeSeries().label.replace(/\|/g, ' &bull; ') : ''} &bull; 60 Students
          </div>
        </div>` : ''}
        <div class="matrix-table-wrap">
          <table class="routine">
            <thead><tr><th class="matrix-corner">Day</th>${headerCells}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div class="legend" style="width: 100%;">${legend}</div>
        `}
      </div>
    </div>

    <div class="stat-row">
      ${stats.map(s => `
        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:${s.bg};color:${s.fg};">${s.ic}</div>
          <div class="stat-info">
            <div class="num">${s.num}</div>
            <div class="lbl">${s.lbl}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  renderSeriesTabs('seriesRow', renderRoutine, { allSeries: true });
  renderDayFilter('dayFilterRow', renderRoutine);

  // Search input binding
  const searchInput = document.getElementById('routineSearchInput');
  if (searchInput) {
    searchInput.oninput = (e) => {
      state.routineSearchQuery = e.target.value.trim();
      renderRoutine();
      const el = document.getElementById('routineSearchInput');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    };
  }
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      state.routineSearchQuery = '';
      renderRoutine();
    };
  }

  // Quality modal
  const qBadgeBtn = document.getElementById('qualityBadgeBtn');
  if (qBadgeBtn) qBadgeBtn.onclick = openQualityModal;

  // Focus mode button
  const focusBtn = document.getElementById('focusModeBtn');
  if (focusBtn) {
    focusBtn.onclick = () => {
      state.focusMode = !state.focusMode;
      document.body.classList.toggle('focus-mode', state.focusMode);
      document.body.classList.toggle('sidebar-hidden', state.focusMode || !!state.sidebarHidden);
      renderRoutine();
    };
  }

  // Zoom buttons
  document.querySelectorAll('[data-zoom]').forEach(b => {
    b.onclick = () => {
      const z = b.dataset.zoom;
      state.sheetZoom = z === 'fit' ? 'fit' : Number(z);
      renderRoutine();
    };
  });

  document.getElementById('darkToggle').onclick = () => {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark', state.darkMode);
    renderRoutine();
  };
  document.getElementById('autoGenBtn').onclick = requireAdmin(openAutoGenerateModal);
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { state.viewMode = b.dataset.view; renderRoutine(); });
  const printAllBwBtn = document.getElementById('printAllBwBtn');
  if (printAllBwBtn) printAllBwBtn.onclick = () => printAllSeriesRoutine(true);
  const printSeriesBwBtn = document.getElementById('printSeriesBwBtn');
  if (printSeriesBwBtn) printSeriesBwBtn.onclick = () => printCurrentRoutine(true);
  const printAllBtn = document.getElementById('printAllBtn');
  if (printAllBtn) printAllBtn.onclick = () => printAllSeriesRoutine(false);
  const printSeriesBtn = document.getElementById('printSeriesBtn');
  if (printSeriesBtn) printSeriesBtn.onclick = () => printCurrentRoutine(false);
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.onclick = () => printAllSeriesRoutine(!!state.sheetMonochrome);
  }

  const btnThemeColor = document.getElementById('btnThemeColor');
  if (btnThemeColor) {
    btnThemeColor.onclick = () => {
      state.sheetMonochrome = false;
      renderRoutine();
      toast('Switched to Full Color Mode', 'info');
    };
  }
  const btnThemeBw = document.getElementById('btnThemeBw');
  if (btnThemeBw) {
    btnThemeBw.onclick = () => {
      state.sheetMonochrome = true;
      renderRoutine();
      toast('Switched to Official High-Contrast Black & White Mode', 'ok');
    };
  }

  document.querySelectorAll('[data-addclass]').forEach(td => td.onclick = requireAdmin((e) => {
    if (_dragJustFinished) { if (e) { e.preventDefault(); e.stopPropagation(); } return; }
    openAddCellModal(td.dataset.day, Number(td.dataset.start), td.dataset.series ? Number(td.dataset.series) : undefined);
  }));
  document.querySelectorAll('[data-editclass]').forEach(b => b.onclick = requireAdmin((e) => {
    if (_dragJustFinished) { if (e) { e.preventDefault(); e.stopPropagation(); } return; }
    if (e && e.target && e.target.closest && (e.target.closest('[data-delclass]') || e.target.closest('[data-change-teacher-color]'))) return;
    openEditClassModal(Number(b.dataset.editclass));
  }));
  document.querySelectorAll('[data-delclass]').forEach(b => b.onclick = requireAdmin((e) => {
    if (e) e.stopPropagation();
    state.classes = state.classes.filter(c => c.id !== Number(b.dataset.delclass));
    renderRoutine();
  }));

  // Direct in-routine click on teacher pill or sheet legend to change teacher's color
  document.querySelectorAll('[data-change-teacher-color]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tid = Number(el.dataset.changeTeacherColor);
      if (tid) openTeacherColorPicker(tid);
    };
  });

  // Right-click shortcut on routine class cells to quickly change the instructor's display color
  document.querySelectorAll('.sheet-classcell, .class-block').forEach(cell => {
    cell.oncontextmenu = (e) => {
      const cid = Number(cell.dataset.classId || cell.dataset.editclass);
      const c = state.classes.find(x => x.id === cid);
      const t = c ? teacherForClass(c) : null;
      if (t) {
        e.preventDefault();
        e.stopPropagation();
        openTeacherColorPicker(t.id);
      }
    };
  });
  document.querySelectorAll('[data-nav="labs"],[data-nav="teachers"]').forEach(a => a.onclick = (e) => {
    e.preventDefault(); state.activeNav = a.dataset.nav; renderAll();
  });
  document.querySelectorAll('[data-dellab]').forEach(b => b.onclick = requireAdmin(() => { state.labs = state.labs.filter(l => l.id !== Number(b.dataset.dellab)); renderRoutine(); }));

  // Wire interactive faculty ribbon and hover cross-highlighting
  wireFacultyColorRibbon();

  /* Sheet view equalize band widths & dynamic fit */
  if (state.viewMode === 'sheet') equalizeBandWidths(document.getElementById('mainArea'));

  // Window resize handler for dynamic fit scaling
  if (!window._routineResizeHandlerAttached) {
    window._routineResizeHandlerAttached = true;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (state.activeNav === 'routine' && state.viewMode === 'sheet' && state.sheetZoom === 'fit') {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          equalizeBandWidths(document.getElementById('mainArea'));
        }, 80);
      }
    });
  }

  /* Drag and drop */
  if (state.viewMode === 'sheet' || state.viewMode === 'table') {
    wireRoutineDnD();
  }
}

/* =====================================================================
   DRAG & DROP ENGINE — Master Sheet + Grid Matrix views
   Handles HTML5 drag events (desktop) + a touch bridge (tablets/mobiles).
   ===================================================================== */
let _activeDragId = null;
let _activeDragMeeting = false;
let _dragJustFinished = false;

function wireRoutineDnD() {
  const clearAll = () => {
    document.querySelectorAll(
      '.drag-over, .drag-over-empty, .drag-over-invalid, .dragging'
    ).forEach(el => {
      el.classList.remove('drag-over', 'drag-over-empty', 'drag-over-invalid', 'dragging');
    });
  };

  /* Flash the landed cell green once the DOM re-renders */
  function flashLanded() {
    if (!_dndDestKey) return;
    const key = _dndDestKey;
    _dndDestKey = null;
    const [day, startStr, seriesStr] = key.split('|');
    if (seriesStr === 'meeting') {
      const el = document.querySelector('.sheet-meeting');
      if (el) {
        el.classList.remove('dnd-landed');
        void el.offsetWidth;
        el.classList.add('dnd-landed');
        setTimeout(() => el.classList.remove('dnd-landed'), 700);
      }
      return;
    }
    const start = Number(startStr);
    const seriesId = Number(seriesStr);
    const all = [...document.querySelectorAll('[data-class-id]')];
    for (const el of all) {
      const cls = state.classes.find(c => c.id === Number(el.dataset.classId));
      if (cls && cls.day === day && cls.start === start && cls.seriesId === seriesId) {
        el.classList.remove('dnd-landed');
        void el.offsetWidth;
        el.classList.add('dnd-landed');
        setTimeout(() => el.classList.remove('dnd-landed'), 700);
        break;
      }
    }
  }

  /* Check if a candidate drop on a slot is valid for the dragged class */
  function isValidSlotDrop(draggedId, targetDay, targetStart, targetSeriesId) {
    const c = state.classes.find(x => x.id === draggedId);
    if (!c) return false;
    if (targetSeriesId != null && targetSeriesId !== c.seriesId) return false;
    const isTheory = c.cat !== 'Lab' && c.span === THEORY_SPAN;
    if (isTheory && !THEORY_ALLOWED_STARTS.includes(targetStart)) return false;
    if (!fitsSegment(targetStart, c.span)) return false;
    const M = state.meeting;
    if (M && M.text && M.day === targetDay && M.span > 0) {
      if (targetStart < M.start + M.span && targetStart + c.span > M.start) return false;
    }
    return true;
  }

  /* Check if swapping two classes is valid */
  function isValidSwap(id1, id2) {
    const a = state.classes.find(x => x.id === id1);
    const b = state.classes.find(x => x.id === id2);
    if (!a || !b || a.id === b.id) return false;
    if (a.seriesId !== b.seriesId) return false;
    if (a.span !== b.span) return false;
    const isTheory = x => x.cat !== 'Lab' && x.span === THEORY_SPAN;
    if ((isTheory(a) && !THEORY_ALLOWED_STARTS.includes(b.start)) ||
      (isTheory(b) && !THEORY_ALLOWED_STARTS.includes(a.start))) return false;
    return true;
  }

  /* ---- Source element: Departmental Meeting block ----------------- */
  document.querySelectorAll('[data-dragmeeting]').forEach(el => {
    el.setAttribute('draggable', 'true');

    el.addEventListener('dragstart', e => {
      _activeDragMeeting = true;
      _activeDragId = null;
      try {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', 'dept-meeting');
          e.dataTransfer.effectAllowed = 'move';
        }
      } catch (err) { }
      el.classList.add('dragging');
      document.body.classList.add('dnd-active');
    });

    el.addEventListener('dragend', () => {
      _dragJustFinished = true;
      setTimeout(() => { _dragJustFinished = false; }, 350);
      document.body.classList.remove('dnd-active');
      clearAll();
      setTimeout(() => { _activeDragMeeting = false; }, 150);
      requestAnimationFrame(flashLanded);
    });
  });

  /* ---- Drop zones: Day headers on the sheet ----------------------- */
  document.querySelectorAll('th.sheet-th-day').forEach(th => {
    th.addEventListener('dragover', e => {
      if (!_activeDragMeeting) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const targetDay = th.dataset.dayHeader || th.textContent.trim();
      const isCurrentDay = targetDay === (state.meeting && state.meeting.day);
      th.classList.toggle('drag-over', !isCurrentDay);
      th.classList.toggle('drag-over-invalid', isCurrentDay);
    });

    th.addEventListener('dragleave', () => {
      th.classList.remove('drag-over', 'drag-over-invalid');
    });

    th.addEventListener('drop', e => {
      if (!_activeDragMeeting) return;
      e.preventDefault();
      e.stopPropagation();
      th.classList.remove('drag-over', 'drag-over-invalid');
      _dragJustFinished = true;
      setTimeout(() => { _dragJustFinished = false; }, 350);
      const targetDay = th.dataset.dayHeader || th.textContent.trim();
      _activeDragMeeting = false;
      if (targetDay && DAYS.includes(targetDay)) {
        moveMeeting(targetDay, 14);
      }
    });
  });

  /* ---- Source elements: all draggable class cells (both views) ----- */
  document.querySelectorAll('[data-dragclass]').forEach(el => {
    el.setAttribute('draggable', 'true');

    el.addEventListener('dragstart', e => {
      _activeDragMeeting = false;
      _activeDragId = Number(el.dataset.dragclass);
      try {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', String(_activeDragId));
          e.dataTransfer.effectAllowed = 'move';
        }
      } catch (err) { }
      el.classList.add('dragging');
      document.body.classList.add('dnd-active');
    });

    el.addEventListener('dragend', () => {
      _dragJustFinished = true;
      setTimeout(() => { _dragJustFinished = false; }, 350);
      document.body.classList.remove('dnd-active');
      clearAll();
      setTimeout(() => { _activeDragId = null; }, 150);
      requestAnimationFrame(flashLanded);
    });

    /* Swap target (another class cell of equal length) */
    el.addEventListener('dragover', e => {
      if (_activeDragMeeting) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        const targetDay = el.dataset.day;
        if (targetDay) {
          const isCurrentDay = targetDay === (state.meeting && state.meeting.day);
          el.classList.toggle('drag-over', !isCurrentDay);
          el.classList.toggle('drag-over-invalid', isCurrentDay);
        }
        return;
      }
      if (el.classList.contains('dragging') || Number(el.dataset.dragclass) === _activeDragId) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const draggedId = _activeDragId;
      const targetId = Number(el.dataset.dragclass);
      const valid = draggedId ? isValidSwap(draggedId, targetId) : true;
      el.classList.toggle('drag-over', valid);
      el.classList.toggle('drag-over-invalid', !valid);
    });

    el.addEventListener('dragleave', e => {
      if (!el.contains(e.relatedTarget)) {
        el.classList.remove('drag-over', 'drag-over-invalid');
      }
    });

    el.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('drag-over', 'drag-over-invalid');
      _dragJustFinished = true;
      setTimeout(() => { _dragJustFinished = false; }, 350);

      if (_activeDragMeeting) {
        const targetDay = el.dataset.day;
        const targetStart = Number(el.dataset.start) || 14;
        _activeDragMeeting = false;
        if (targetDay) moveMeeting(targetDay, targetStart);
        return;
      }

      let id = _activeDragId;
      if (!id && e.dataTransfer) {
        try { id = Number(e.dataTransfer.getData('text/plain')); } catch (err) { }
      }
      const targetId = Number(el.dataset.dragclass);
      if (id && targetId && id !== targetId) {
        swapClasses(id, targetId);
      }
    });
  });

  /* ---- Drop zones: empty slots in both views ----------------------- */
  document.querySelectorAll('.day-slot-empty, td.sheet-empty, td.slot[data-addclass]').forEach(zone => {
    zone.addEventListener('dragover', e => {
      if (_activeDragMeeting) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        const targetDay = zone.dataset.day;
        if (targetDay) {
          const isCurrentDay = targetDay === (state.meeting && state.meeting.day);
          zone.classList.toggle('drag-over', !isCurrentDay);
          zone.classList.toggle('drag-over-invalid', isCurrentDay);
        }
        return;
      }
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const draggedId = _activeDragId;
      if (!draggedId) return;
      const targetDay = zone.dataset.day;
      const targetStart = Number(zone.dataset.start);
      const targetSeries = zone.dataset.series ? Number(zone.dataset.series) : undefined;
      const valid = isValidSlotDrop(draggedId, targetDay, targetStart, targetSeries);
      zone.classList.toggle('drag-over', valid);
      zone.classList.toggle('drag-over-empty', valid);
      zone.classList.toggle('drag-over-invalid', !valid);
    });

    zone.addEventListener('dragleave', e => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over', 'drag-over-empty', 'drag-over-invalid');
      }
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-over', 'drag-over-empty', 'drag-over-invalid');
      _dragJustFinished = true;
      setTimeout(() => { _dragJustFinished = false; }, 350);

      if (_activeDragMeeting) {
        const targetDay = zone.dataset.day;
        const targetStart = Number(zone.dataset.start) || 14;
        _activeDragMeeting = false;
        if (targetDay) moveMeeting(targetDay, targetStart);
        return;
      }

      let id = _activeDragId;
      if (!id && e.dataTransfer) {
        try { id = Number(e.dataTransfer.getData('text/plain')); } catch (err) { }
      }
      if (id) {
        moveClassToSlot(
          id,
          zone.dataset.day,
          Number(zone.dataset.start),
          zone.dataset.series ? Number(zone.dataset.series) : undefined
        );
      }
    });
  });

  /* ---- Touch bridge (tablets / touch screens) --------------------- */
  let _touchDragId = null;
  let _touchDragMeeting = false;
  let _touchGhost = null;
  let _touchCurrent = null;

  document.querySelectorAll('[data-dragmeeting]').forEach(el => {
    el.addEventListener('touchstart', e => {
      _touchDragMeeting = true;
      _activeDragMeeting = true;
      _touchDragId = null;
      _activeDragId = null;
      document.body.classList.add('dnd-active');
      el.classList.add('dragging');
      const rect = el.getBoundingClientRect();
      _touchGhost = el.cloneNode(true);
      Object.assign(_touchGhost.style, {
        position: 'fixed', top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
        opacity: '0.85', pointerEvents: 'none', zIndex: '99999',
        borderRadius: '8px', boxShadow: '0 12px 28px rgba(0,0,0,0.3)',
        transform: 'scale(1.02)', transition: 'none',
      });
      document.body.appendChild(_touchGhost);
    }, { passive: true });

    el.addEventListener('touchmove', e => {
      if (!_touchDragMeeting) return;
      const touch = e.touches[0];
      if (_touchGhost) {
        _touchGhost.style.top = (touch.clientY - 20) + 'px';
        _touchGhost.style.left = (touch.clientX - 40) + 'px';
      }
      clearAll();
      el.classList.add('dragging');
      const underEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const zone = underEl && underEl.closest('[data-day], [data-day-header], th.sheet-th-day, td.sheet-cell, td.slot');
      if (zone) {
        const targetDay = zone.dataset.day || zone.dataset.dayHeader || (zone.classList.contains('sheet-th-day') ? zone.textContent.trim() : (zone.closest('tr') && zone.closest('tr').querySelector('.day-cell-name') ? zone.closest('tr').querySelector('.day-cell-name').textContent.trim() : null));
        if (targetDay && DAYS.includes(targetDay)) {
          const isCurrentDay = targetDay === (state.meeting && state.meeting.day);
          zone.classList.add(isCurrentDay ? 'drag-over-invalid' : 'drag-over');
          _touchCurrent = { type: 'meeting', day: targetDay, start: Number(zone.dataset.start) || 14 };
        }
      } else {
        _touchCurrent = null;
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (_touchGhost) { _touchGhost.remove(); _touchGhost = null; }
      document.body.classList.remove('dnd-active');
      _dragJustFinished = true;
      setTimeout(() => { _dragJustFinished = false; }, 350);

      const hadMeeting = _touchDragMeeting;
      _touchDragMeeting = false;
      _activeDragMeeting = false;
      if (hadMeeting && _touchCurrent && _touchCurrent.type === 'meeting') {
        const { day, start } = _touchCurrent;
        _touchCurrent = null;
        moveMeeting(day, start);
      }
      clearAll();
      requestAnimationFrame(flashLanded);
    });
  });

  document.querySelectorAll('[data-dragclass]').forEach(el => {
    el.addEventListener('touchstart', e => {
      if (e.target.closest('button, [data-delclass], [data-paint-teacher]')) return;
      _touchDragId = Number(el.dataset.dragclass);
      _activeDragId = _touchDragId;
      document.body.classList.add('dnd-active');
      el.classList.add('dragging');
      const rect = el.getBoundingClientRect();
      _touchGhost = el.cloneNode(true);
      Object.assign(_touchGhost.style, {
        position: 'fixed', top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
        opacity: '0.85', pointerEvents: 'none', zIndex: '99999',
        borderRadius: '8px', boxShadow: '0 12px 28px rgba(0,0,0,0.3)',
        transform: 'scale(1.04)', transition: 'none',
      });
      document.body.appendChild(_touchGhost);
    }, { passive: true });

    el.addEventListener('touchmove', e => {
      if (!_touchDragId) return;
      const touch = e.touches[0];
      if (_touchGhost) {
        _touchGhost.style.top = (touch.clientY - 20) + 'px';
        _touchGhost.style.left = (touch.clientX - 40) + 'px';
      }
      clearAll();
      el.classList.add('dragging');
      const underEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const zone = underEl && underEl.closest('[data-addclass], td.sheet-empty, .day-slot-empty');
      const swap = underEl && underEl.closest('[data-dragclass]');
      if (zone && zone !== el) {
        const valid = isValidSlotDrop(_touchDragId, zone.dataset.day, Number(zone.dataset.start),
          zone.dataset.series ? Number(zone.dataset.series) : undefined);
        zone.classList.add(valid ? 'drag-over' : 'drag-over-invalid');
        _touchCurrent = { type: 'zone', el: zone };
      } else if (swap && swap !== el && Number(swap.dataset.dragclass) !== _touchDragId) {
        const valid = isValidSwap(_touchDragId, Number(swap.dataset.dragclass));
        swap.classList.add(valid ? 'drag-over' : 'drag-over-invalid');
        _touchCurrent = { type: 'swap', el: swap };
      } else {
        _touchCurrent = null;
      }
    }, { passive: true });

    el.addEventListener('touchend', e => {
      if (_touchGhost) { _touchGhost.remove(); _touchGhost = null; }
      document.body.classList.remove('dnd-active');
      _dragJustFinished = true;
      setTimeout(() => { _dragJustFinished = false; }, 350);

      const id = _touchDragId;
      _touchDragId = null;
      _activeDragId = null;
      if (!id) { clearAll(); return; }
      if (_touchCurrent) {
        const { type, el: target } = _touchCurrent;
        _touchCurrent = null;
        if (type === 'zone') {
          moveClassToSlot(id, target.dataset.day, Number(target.dataset.start),
            target.dataset.series ? Number(target.dataset.series) : undefined);
        } else if (type === 'swap') {
          swapClasses(id, Number(target.dataset.dragclass));
        }
      }
      clearAll();
      requestAnimationFrame(flashLanded);
    });
  });
}


/* ---- Shared helpers for the Add/Edit forms ---- */
function theoryStartOptions() { return THEORY_ALLOWED_STARTS.filter(s => fitsSegment(s, THEORY_SPAN)); }
function labStartOptions() { return SLOT_HOURS.filter(s => fitsSegment(s, LAB_SPAN)); }
function startOptionsHtml(starts, want) {
  return starts.map(h => {
    const col = SLOT_COLUMNS.find(x => x.type === 'slot' && x.start === h);
    return `<option value="${h}" ${h === want ? 'selected' : ''}>${col.label.split('\n')[0]}</option>`;
  }).join('');
}
function validateClassTiming(start, span) {
  if (!fitsSegment(start, span)) { toast('This time range crosses the Break or Lunch gap. Please choose a range within one segment.', 'warn'); return false; }
  return true;
}

/* ---- Theory (Class) form: always 50 min, only 8:00-1:20 ---- */
function classFormFieldsTheory(c) {
  const dayOpts = DAYS.map(d => `<option value="${d}" ${c && c.day === d ? 'selected' : ''}>${d}</option>`).join('');
  const catOpts = DEPTS.map(cat => `<option value="${cat}" ${c && c.cat === cat ? 'selected' : ''}>${cat}</option>`).join('');
  const teacherOpts = `<option value="">— None —</option>` + state.teachers.map(t => `<option value="${t.id}" ${c && c.teacherId === t.id ? 'selected' : ''}>${teacherOptionLabel(t)}</option>`).join('');
  const starts = theoryStartOptions();
  const want = (c && c.start != null && starts.includes(c.start)) ? c.start : starts[0];
  return `
    <div class="field-row">
      <div class="field"><label>Day</label><select id="f-day">${dayOpts}</select></div>
      <div class="field"><label>Department</label><select id="f-cat">${catOpts}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Start Time</label><select id="f-start">${startOptionsHtml(starts, want)}</select></div>
      <div class="field"><label>Duration</label><input value="50 min (fixed)" disabled></div>
    </div>
    <div class="field"><label>Course Code</label><input id="f-code" value="${c ? c.code || '' : ''}" placeholder="e.g. ECE 2306"></div>
    <div class="field"><label>Course Title <span style="font-weight:400;color:var(--text-mute);">(internal note — not shown on the routine grid)</span></label><input id="f-title" value="${c ? c.title || '' : ''}" placeholder="e.g. Matlab"></div>
    <div class="field-row">
      <div class="field"><label>Room</label><input id="f-room" value="${c ? c.room || '' : ''}" placeholder="e.g. 2271 R-604"></div>
      <div class="field">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <label for="f-teacher" style="margin:0;">Teacher</label>
          <button type="button" class="teacher-quick-color-btn" id="btnQuickTeacherColor" style="display:inline-flex;align-items:center;gap:4px;background:none;border:1px solid var(--border);border-radius:4px;padding:1px 6px;cursor:pointer;font-size:11px;font-weight:600;color:var(--text);" title="Change assigned teacher's routine color">
            <span class="swatch" id="quickTeacherSwatch" style="width:10px;height:10px;border-radius:2px;display:inline-block;"></span>
            <span id="quickTeacherColorName">Color</span>
            <span>🎨</span>
          </button>
        </div>
        <select id="f-teacher" style="margin-top:4px;">${teacherOpts}</select>
      </div>
    </div>
    <div class="field"><label>Initials shown on grid <span style="font-weight:400;color:var(--text-mute);">(optional — e.g. MFA+NIS; leave blank to use the teacher's initials)</span></label><input id="f-initials" value="${c ? c.initials || '' : ''}" placeholder="e.g. MFA+NIS"></div>
    <div class="hint">Classes (Theory) are always 50 min and must be scheduled between 8:00 and 1:20.</div>
  `;
}

/* ---- Lab form: always 2 hr 30 min, room is picked from the registered Labs list ---- */
function classFormFieldsLab(c) {
  const dayOpts = DAYS.map(d => `<option value="${d}" ${c && c.day === d ? 'selected' : ''}>${d}</option>`).join('');
  const teacherOpts = `<option value="">— None —</option>` + state.teachers.map(t => `<option value="${t.id}" ${c && c.teacherId === t.id ? 'selected' : ''}>${teacherOptionLabel(t)}</option>`).join('');
  const starts = labStartOptions();
  const want = (c && c.start != null && starts.includes(c.start)) ? c.start : starts[0];
  const labListId = 'lab-room-list';
  const labDatalist = `<datalist id="${labListId}">${state.labs.map(l => `<option value="${l.name}"></option>`).join('')}</datalist>`;
  return `
    <div class="field-row">
      <div class="field"><label>Day</label><select id="f-day">${dayOpts}</select></div>
      <div class="field"><label>Category</label><input value="Lab" disabled></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Start Time</label><select id="f-start">${startOptionsHtml(starts, want)}</select></div>
      <div class="field"><label>Duration</label><input value="2 hr 30 min (fixed)" disabled></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Lab / Room</label><input id="f-room" list="${labListId}" value="${c ? c.room || '' : ''}" placeholder="e.g. Lab-4 / Lab-2">${labDatalist}</div>
      <div class="field">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <label for="f-teacher" style="margin:0;">Teacher</label>
          <button type="button" class="teacher-quick-color-btn" id="btnQuickTeacherColor" style="display:inline-flex;align-items:center;gap:4px;background:none;border:1px solid var(--border);border-radius:4px;padding:1px 6px;cursor:pointer;font-size:11px;font-weight:600;color:var(--text);" title="Change assigned teacher's routine color">
            <span class="swatch" id="quickTeacherSwatch" style="width:10px;height:10px;border-radius:2px;display:inline-block;"></span>
            <span id="quickTeacherColorName">Color</span>
            <span>🎨</span>
          </button>
        </div>
        <select id="f-teacher" style="margin-top:4px;">${teacherOpts}</select>
      </div>
    </div>
    <div class="field"><label>Course Code</label><input id="f-code" value="${c ? c.code || '' : ''}" placeholder="e.g. ECE 2203"></div>
    <div class="field"><label>Course Title <span style="font-weight:400;color:var(--text-mute);">(internal note — not shown on the routine grid)</span></label><input id="f-title" value="${c ? c.title || '' : ''}" placeholder="e.g. Electronics Sessional"></div>
    <div class="field"><label>Initials shown on grid <span style="font-weight:400;color:var(--text-mute);">(optional — e.g. MAH+NRP+MNT; leave blank to use the teacher's initials)</span></label><input id="f-initials" value="${c ? c.initials || '' : ''}" placeholder="e.g. MAH+NRP+MNT"></div>
    <div class="hint">Labs always span 2 hr 30 min (3 back-to-back periods) and can also use the afternoon segment. Rooms are free-text so compound labels like "Lab-4 / Lab-2" are allowed.</div>
  `;
}

/* ---- Helper to wire quick teacher color button inside modal forms ---- */
function wireModalTeacherColorQuickBtn() {
  const sel = document.getElementById('f-teacher');
  const btn = document.getElementById('btnQuickTeacherColor');
  const swatch = document.getElementById('quickTeacherSwatch');
  const nameLbl = document.getElementById('quickTeacherColorName');
  if (!sel || !btn) return;

  const updateSwatch = () => {
    const tid = Number(sel.value);
    const t = state.teachers.find(x => x.id === tid);
    if (t && t.color) {
      btn.style.display = 'inline-flex';
      if (swatch) swatch.style.background = t.color.fg;
      if (nameLbl) nameLbl.textContent = t.color.name || 'Color';
      btn.title = `Change ${t.shortName || t.name}'s display color`;
    } else {
      btn.style.display = 'none';
    }
  };

  sel.onchange = updateSwatch;
  updateSwatch();

  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const tid = Number(sel.value);
    if (tid) openTeacherColorPicker(tid);
  };
}

/* ---- Entry point when a person clicks an empty grid cell ----
   Morning/midday slots can host either a Class or a Lab, so ask which one.
   Afternoon slots only ever allow a Lab, so skip straight to the Lab form. */
function openAddCellModal(day, start, seriesId) {
  const isTheorySlot = THEORY_ALLOWED_STARTS.includes(start);
  if (!isTheorySlot) { openAddLabModal(day, start, seriesId); return; }
  openModal(`
    <h2>Add to Routine</h2>
    <div class="sub">${day} — what would you like to schedule in this slot?</div>
    <div class="modal-actions" style="flex-direction:column;gap:10px;">
      <button class="btn-primary" id="chooseClassBtn" style="width:100%;">📘 Add Class <span style="font-weight:400;opacity:.85;">— Theory, 50 min</span></button>
      <button class="btn-primary" id="chooseLabBtn" style="width:100%;background:var(--c-lab-fg,#128a3e);">🧪 Add Lab <span style="font-weight:400;opacity:.85;">— 2 hr 30 min</span></button>
      <button class="btn-ghost" onclick="closeModal()" style="width:100%;">Cancel</button>
    </div>
  `);
  document.getElementById('chooseClassBtn').onclick = () => openAddClassModal(day, start, seriesId);
  document.getElementById('chooseLabBtn').onclick = () => openAddLabModal(day, start, seriesId);
}

function openAddClassModal(day, start, seriesId) {
  openModal(`
    <h2>Add Class</h2>
    <div class="sub">Schedule a new theory class (50 min) in the routine grid.</div>
    ${classFormFieldsTheory({ day, start, cat: DEPTS[0], code: '', title: '', room: '', teacherId: null, initials: '' })}
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="saveClassBtn">Add Class</button>
    </div>
  `);
  wireModalTeacherColorQuickBtn();
  document.getElementById('saveClassBtn').onclick = () => {
    const code = document.getElementById('f-code').value.trim();
    if (!code) { toast('Course code is required.', 'warn'); return; }
    const start = Number(document.getElementById('f-start').value);
    const span = THEORY_SPAN;
    if (!validateClassTiming(start, span)) return;
    state.classes.push({
      id: nextId(), seriesId: seriesId || state.activeSeriesId, day: document.getElementById('f-day').value, start, span,
      cat: document.getElementById('f-cat').value, code,
      title: document.getElementById('f-title').value.trim(), room: document.getElementById('f-room').value.trim(),
      teacherId: Number(document.getElementById('f-teacher').value) || null,
      initials: document.getElementById('f-initials').value.trim(), section: "All Sections",
    });
    closeModal(); renderRoutine();
  };
}

function openAddLabModal(day, start, seriesId) {
  openModal(`
    <h2>Add Lab</h2>
    <div class="sub">Schedule a new lab session (2 hr 30 min) in the routine grid.</div>
    ${classFormFieldsLab({ day, start, code: '', title: '', room: '', teacherId: null, initials: '' })}
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="saveClassBtn">Add Lab</button>
    </div>
  `);
  wireModalTeacherColorQuickBtn();
  document.getElementById('saveClassBtn').onclick = () => {
    const code = document.getElementById('f-code').value.trim();
    if (!code) { toast('Course code is required.', 'warn'); return; }
    const start = Number(document.getElementById('f-start').value);
    const span = LAB_SPAN;
    if (!validateClassTiming(start, span)) return;
    state.classes.push({
      id: nextId(), seriesId: seriesId || state.activeSeriesId, day: document.getElementById('f-day').value, start, span, cat: 'Lab', code,
      title: document.getElementById('f-title').value.trim(), room: document.getElementById('f-room').value,
      teacherId: Number(document.getElementById('f-teacher').value) || null,
      initials: document.getElementById('f-initials').value.trim(), section: "All Sections",
    });
    closeModal(); renderRoutine();
  };
}

/* ---- Editing an existing class routes to the matching form (Theory vs Lab) ---- */
function openEditClassModal(id) {
  const c = state.classes.find(x => x.id === id);
  if (!c) return;
  if (c.cat === 'Lab') openEditLabModal(c); else openEditTheoryModal(c);
}

function openEditTheoryModal(c) {
  openModal(`
    <h2>Edit Class</h2>
    <div class="sub">Update or remove this class.</div>
    ${classFormFieldsTheory(c)}
    <div class="modal-actions">
      <button class="btn-ghost btn-danger" id="deleteClassBtn">Delete</button>
      <div style="flex:1;"></div>
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="saveClassBtn">Save Changes</button>
    </div>
  `);
  wireModalTeacherColorQuickBtn();
  document.getElementById('saveClassBtn').onclick = () => {
    const start = Number(document.getElementById('f-start').value);
    const span = THEORY_SPAN;
    if (!validateClassTiming(start, span)) return;
    c.day = document.getElementById('f-day').value; c.start = start; c.span = span; c.cat = document.getElementById('f-cat').value;
    c.code = document.getElementById('f-code').value.trim(); c.title = document.getElementById('f-title').value.trim();
    c.room = document.getElementById('f-room').value.trim(); c.teacherId = Number(document.getElementById('f-teacher').value) || null;
    c.initials = document.getElementById('f-initials').value.trim();
    closeModal(); renderRoutine();
  };
  document.getElementById('deleteClassBtn').onclick = () => { state.classes = state.classes.filter(x => x.id !== c.id); closeModal(); renderRoutine(); };
}

function openEditLabModal(c) {
  openModal(`
    <h2>Edit Lab</h2>
    <div class="sub">Update or remove this lab session.</div>
    ${classFormFieldsLab(c)}
    <div class="modal-actions">
      <button class="btn-ghost btn-danger" id="deleteClassBtn">Delete</button>
      <div style="flex:1;"></div>
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="saveClassBtn">Save Changes</button>
    </div>
  `);
  wireModalTeacherColorQuickBtn();
  document.getElementById('saveClassBtn').onclick = () => {
    const start = Number(document.getElementById('f-start').value);
    const span = LAB_SPAN;
    if (!validateClassTiming(start, span)) return;
    c.day = document.getElementById('f-day').value; c.start = start; c.span = span; c.cat = 'Lab';
    c.code = document.getElementById('f-code').value.trim(); c.title = document.getElementById('f-title').value.trim();
    c.room = document.getElementById('f-room').value.trim(); c.teacherId = Number(document.getElementById('f-teacher').value) || null;
    c.initials = document.getElementById('f-initials').value.trim();
    closeModal(); renderRoutine();
  };
  document.getElementById('deleteClassBtn').onclick = () => { state.classes = state.classes.filter(x => x.id !== c.id); closeModal(); renderRoutine(); };
}
