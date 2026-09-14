const fs = require('fs');
const vm = require('vm');

const sandbox = {
  localStorage: { getItem: () => null, setItem: () => { } },
  window: { addEventListener: () => { } },
  document: {
    createElement: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }),
    body: { classList: { add: () => { }, remove: () => { } } },
    getElementById: () => null,
    querySelectorAll: () => []
  },
  console,
  setTimeout,
  clearTimeout
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/data.js', 'utf8') + '\nglobalThis.state = state; globalThis.seedData = seedData; globalThis.DAYS = DAYS; globalThis.SLOT_COLUMNS = SLOT_COLUMNS; globalThis.THEORY_ALLOWED_STARTS = THEORY_ALLOWED_STARTS; globalThis.THEORY_SPAN = THEORY_SPAN; globalThis.LAB_SPAN = LAB_SPAN;', sandbox);
sandbox.seedData();

// Helper to resolve lab ID from raw string
function resolveLabId(roomStr, state) {
  if (!roomStr) return (state.labs[0] ? state.labs[0].id : null);
  const trimmed = roomStr.trim();
  const exact = state.labs.find(l => l.name.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact.id;
  const m = trimmed.match(/Lab-?(\d+)/i);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    if (state.labs[idx]) return state.labs[idx].id;
  }
  return state.labs[0] ? state.labs[0].id : null;
}

// Ensure courses have clean lab and teacher links
sandbox.state.courses.forEach(c => {
  if (c.type === 'lab') {
    const rawClass = sandbox.state.classes.find(cl => cl.seriesId === c.seriesId && cl.code === c.code);
    const labId = resolveLabId(rawClass ? rawClass.room : '', sandbox.state);
    const teacherId = c.teacherId || (rawClass ? rawClass.teacherId : null) || sandbox.state.teachers[0].id;
    c.groups = [{ labId, teacherId, size: 60 }];
  } else {
    if (!c.teacherId) {
      const rawClass = sandbox.state.classes.find(cl => cl.seriesId === c.seriesId && cl.code === c.code);
      c.teacherId = (rawClass ? rawClass.teacherId : null) || sandbox.state.teachers[0].id;
    }
  }
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function runScheduler(state, options = {}) {
  const scope = options.scope || 'all'; // 'all' or 'single'
  const targetSeriesId = options.targetSeriesId || (state.series[0] ? state.series[0].id : null);

  const seriesToSchedule = scope === 'all'
    ? state.series
    : state.series.filter(s => s.id === targetSeriesId);

  // Preserve other series classes if single scope
  const preservedClasses = scope === 'all'
    ? []
    : state.classes.filter(c => c.seriesId !== targetSeriesId);

  // Preferred classroom per series index
  const preferredRoomCode = ['R-404', 'R-403', 'R-402', 'R-401', 'S-401'];

  // Allowed lab starts: Morning (8), Midday (11), Afternoon (14)
  const LAB_START_OPTIONS = [8, 11, 14];

  // Try up to 30 restarts if solver hits a local dead-end
  for (let attempt = 1; attempt <= 30; attempt++) {
    const newClasses = [];
    const teacherBookings = {}; // day -> teacherId -> [{start, span, code}]
    const roomBookings = {};    // day -> roomKey -> [{start, span, code}]
    const seriesBookings = {};  // day -> seriesId -> [{start, span, code}]

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
        // Overlap
        if (start < b.start + b.span && b.start < start + span) return false;
        // Strict No back-to-back: no consecutive slots
        if (start === b.start + b.span) return false; // immediately after
        if (b.start === start + span) return false; // immediately before
        // Also avoid across 10:30-10:50 break (slot 10 ending and slot 11 starting)
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
      // Monday 2:30-5:00 PM (slots 14, 15, 16)
      if (day === 'Monday') {
        if (start < 17 && start + span > 14) return true;
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

    // Seed preserved classes from other series
    preservedClasses.forEach(c => {
      if (c.teacherId) getTeacherList(c.day, c.teacherId).push({ start: c.start, span: c.span, code: c.code });
      if (c.room) {
        const rk = c.cat === 'Lab' ? 'lab-' + c.room : 'room-' + c.room;
        getRoomList(c.day, rk).push({ start: c.start, span: c.span, code: c.code });
      }
      getSeriesList(c.day, c.seriesId).push({ start: c.start, span: c.span, code: c.code });
    });

    // Extract all courses to schedule
    const allCourses = state.courses.filter(c => seriesToSchedule.some(s => s.id === c.seriesId));
    const labCourses = shuffle(allCourses.filter(c => c.type === 'lab'));
    const theoryCourses = shuffle(allCourses.filter(c => c.type === 'theory'));

    let failed = false;

    // --- PHASE 1: LAB COURSES (Most Constrained) ---
    for (const course of labCourses) {
      const g = course.groups && course.groups[0];
      const tid = g ? g.teacherId : course.teacherId;
      const labObj = g && g.labId ? state.labs.find(l => l.id === g.labId) : null;
      const labRoomName = labObj ? labObj.name : (state.labs[0] ? state.labs[0].name : 'Lab-1');
      const labKey = 'lab-' + labRoomName;
      const sessionsNeeded = course.sessionsPerWeek || 1;
      const usedDays = new Set();

      for (let sIdx = 0; sIdx < sessionsNeeded; sIdx++) {
        // Candidate slots for lab: 8 (morning), 11 (midday), 14 (afternoon)
        // Order days, prioritizing days not yet used by this course
        const candidateDays = shuffle(sandbox.DAYS).sort((a, b) => {
          const aUsed = usedDays.has(a) ? 1 : 0;
          const bUsed = usedDays.has(b) ? 1 : 0;
          return aUsed - bUsed;
        });

        let placed = false;
        for (const day of candidateDays) {
          // Shuffle lab starts with slight preference for morning/midday
          const startCandidates = shuffle(LAB_START_OPTIONS);
          for (const start of startCandidates) {
            if (isDeptMeeting(day, start, 3)) continue;
            if (!isSeriesAvailable(course.seriesId, day, start, 3)) continue;
            if (!isRoomAvailable(labKey, day, start, 3)) continue;
            if (!isTeacherAvailable(tid, day, start, 3)) continue;

            // Found valid slot for lab
            bookClass({
              id: 900000 + newClasses.length,
              seriesId: course.seriesId,
              day,
              start,
              span: 3,
              cat: 'Lab',
              code: course.code,
              title: course.title,
              room: labRoomName,
              teacherId: tid,
              section: "All Sections"
            });
            usedDays.add(day);
            placed = true;
            break;
          }
          if (placed) break;
        }

        if (!placed) {
          failed = true;
          break;
        }
      }
      if (failed) break;
    }

    if (failed) continue; // retry restart

    // --- PHASE 2: THEORY COURSES (Morning Priority & Fair Distribution) ---
    // Track morning slots per series to balance morning load
    const morningCountPerSeries = {};
    seriesToSchedule.forEach(s => { morningCountPerSeries[s.id] = 0 });

    // Group theory courses by series so we can round-robin distribute sessions
    const sessionsToPlace = [];
    theoryCourses.forEach(course => {
      const needed = course.sessionsPerWeek || 3;
      for (let i = 0; i < needed; i++) {
        sessionsToPlace.push({
          course,
          sessionIndex: i,
          usedDays: new Set()
        });
      }
    });

    // Interleave sessions across series for fair morning priority
    // Sort so courses from different series take turns
    sessionsToPlace.sort((a, b) => a.sessionIndex - b.sessionIndex);

    // Track which days each course already has a session
    const courseDayMap = {}; // course.id -> Set of days

    for (const item of sessionsToPlace) {
      const course = item.course;
      const tid = course.teacherId;
      const sid = course.seriesId;
      const sIdx = state.series.findIndex(s => s.id === sid);
      const preferredRoom = preferredRoomCode[sIdx] || 'R-404';

      if (!courseDayMap[course.id]) courseDayMap[course.id] = new Set();
      const usedDays = courseDayMap[course.id];

      // Available rooms sorted: preferred room first, then others
      const roomCandidates = [preferredRoom, ...sandbox.state.rooms.map(r => r.code).filter(c => c !== preferredRoom)];

      // Candidate days: prefer days not yet used by this course, and where this series has fewer morning classes
      const candidateDays = [...sandbox.DAYS].sort((a, b) => {
        const aUsed = usedDays.has(a) ? 10 : 0;
        const bUsed = usedDays.has(b) ? 10 : 0;
        if (aUsed !== bUsed) return aUsed - bUsed;
        const aSeriesClasses = getSeriesList(a, sid).length;
        const bSeriesClasses = getSeriesList(b, sid).length;
        return aSeriesClasses - bSeriesClasses;
      });

      // Theory starts: 8, 9, 10 (morning priority!), then 11, 12, 13
      const THEORY_STARTS_PRIORITY = [8, 9, 10, 11, 12, 13];

      let placed = false;

      for (const day of candidateDays) {
        // Check slots in morning-first order
        for (const start of THEORY_STARTS_PRIORITY) {
          if (!isSeriesAvailable(sid, day, start, 1)) continue;
          if (!isTeacherAvailable(tid, day, start, 1)) continue;

          // Find free room
          let chosenRoom = null;
          for (const rm of roomCandidates) {
            if (isRoomAvailable('room-' + rm, day, start, 1)) {
              chosenRoom = rm;
              break;
            }
          }
          if (!chosenRoom) continue;

          // Valid placement!
          bookClass({
            id: 900000 + newClasses.length,
            seriesId: sid,
            day,
            start,
            span: 1,
            cat: course.dept || 'ECE',
            code: course.code,
            title: course.title,
            room: chosenRoom,
            teacherId: tid,
            section: "All Sections"
          });
          usedDays.add(day);
          if (start <= 10) morningCountPerSeries[sid] = (morningCountPerSeries[sid] || 0) + 1;
          placed = true;
          break;
        }
        if (placed) break;
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (!failed) {
      console.log(`Success on attempt ${attempt}! Total classes placed: ${newClasses.length}`);
      return { success: true, classes: [...preservedClasses, ...newClasses], morningStats: morningCountPerSeries };
    }
  }

  return { success: false, error: 'Could not resolve constraints within 30 restarts' };
}

// Run test on ALL series
console.log('--- TEST 1: GENERATE ALL SERIES ---');
const resAll = runScheduler(sandbox.state, { scope: 'all' });
console.log('All series result:', resAll.success);
if (resAll.success) {
  console.log('Classes count:', resAll.classes.length);
  console.log('Morning slots per series:', resAll.morningStats);

  // Verify constraints
  let clashes = 0;
  let backToBackViolations = 0;
  let roomClashes = 0;
  let seriesClashes = 0;

  for (let i = 0; i < resAll.classes.length; i++) {
    for (let j = i + 1; j < resAll.classes.length; j++) {
      const a = resAll.classes[i], b = resAll.classes[j];
      if (a.day !== b.day) continue;

      const overlap = a.start < b.start + b.span && b.start < a.start + a.span;
      if (overlap) {
        if (a.seriesId === b.seriesId) { seriesClashes++; console.log('Series clash:', a, b); }
        if (a.teacherId && a.teacherId === b.teacherId) { clashes++; console.log('Teacher clash:', a, b); }
        if (a.room && a.room === b.room) { roomClashes++; console.log('Room clash:', a, b); }
      }

      // Check teacher back-to-back
      if (a.teacherId && a.teacherId === b.teacherId) {
        if (a.start + a.span === b.start || b.start + b.span === a.start) {
          backToBackViolations++;
          console.log('Back to back violation for teacher', a.teacherId, a.code, '@', a.start, 'and', b.code, '@', b.start, 'on', a.day);
        }
      }
    }
  }

  console.log(`Verification: Series clashes = ${seriesClashes}, Teacher clashes = ${clashes}, Room clashes = ${roomClashes}, Back-to-back violations = ${backToBackViolations}`);
}

// Run test on SINGLE series
console.log('--- TEST 2: GENERATE SPECIFIC SERIES (24 Series) ---');
sandbox.state.classes = resAll.classes;
const s24 = sandbox.state.series[1];
const res24 = runScheduler(sandbox.state, { scope: 'single', targetSeriesId: s24.id });
console.log('Single series 24 result:', res24.success);
if (res24.success) {
  console.log('Total combined classes count:', res24.classes.length);
}

console.log('--- TEST 3: 10 CONSECUTIVE RUNS FOR RELIABILITY ---');
let wins = 0;
for (let i = 1; i <= 10; i++) {
  const trial = runScheduler(sandbox.state, { scope: 'all' });
  if (trial.success) wins++;
}
console.log(`Finished 10 runs: ${wins}/10 succeeded.`);

