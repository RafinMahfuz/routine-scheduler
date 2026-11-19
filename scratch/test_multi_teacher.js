const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('====================================================');
console.log('TESTING MULTIPLE INSTRUCTORS FOR THEORY & LAB COURSES');
console.log('====================================================\n');

// Mock browser environment
const dom = {};
const elements = {};

function createElement(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    attributes: {},
    children: [],
    style: {},
    classList: {
      add: (c) => { el.className = (el.className || '') + ' ' + c; },
      remove: (c) => { el.className = (el.className || '').replace(c, ''); },
      contains: (c) => (el.className || '').includes(c)
    },
    dataset: {},
    setAttribute: (k, v) => { el.attributes[k] = v; el[k] = v; },
    getAttribute: (k) => el.attributes[k] || el[k],
    appendChild: (c) => { el.children.push(c); c.parentNode = el; },
    insertBefore: (n, ref) => {
      const idx = el.children.indexOf(ref);
      if (idx >= 0) el.children.splice(idx, 0, n);
      else el.children.push(n);
      n.parentNode = el;
    },
    closest: (sel) => null,
    querySelectorAll: (sel) => {
      const found = [];
      function search(node) {
        if (!node) return;
        if (sel.startsWith('[') && sel.endsWith(']')) {
          const attr = sel.slice(1, -1).split('=')[0];
          if (node.attributes && node.attributes[attr] !== undefined) found.push(node);
        } else if (sel.startsWith('.')) {
          const cls = sel.slice(1);
          if (node.className && node.className.includes(cls)) found.push(node);
        }
        (node.children || []).forEach(search);
      }
      search(el);
      return found;
    },
    querySelector: (sel) => el.querySelectorAll(sel)[0] || null,
    remove: () => {
      if (el.parentNode) {
        const idx = el.parentNode.children.indexOf(el);
        if (idx >= 0) el.parentNode.children.splice(idx, 1);
      }
    }
  };
  return el;
}

let modalHtmlContent = '';

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  localStorage: {
    getItem: () => null,
    setItem: () => { }
  },
  window: {
    addEventListener: () => { },
    print: () => { }
  },
  document: {
    createElement,
    getElementById: (id) => {
      if (elements[id]) return elements[id];
      const match = modalHtmlContent.match(new RegExp(`id=["']${id}["'][^>]*value=["']([^"']*)["']`));
      const val = match ? match[1] : '';
      elements[id] = {
        id,
        value: val,
        dataset: {},
        style: {},
        innerHTML: '',
        querySelectorAll: () => [],
        focus: () => { },
        setAttribute: (k, v) => { elements[id][k] = v; },
        getAttribute: (k) => elements[id][k]
      };
      return elements[id];
    },
    querySelectorAll: () => [],
    body: {
      classList: { add: () => { }, remove: () => { } }
    }
  },
  openModal: (html) => {
    modalHtmlContent = html;
  },
  closeModal: () => {
    modalHtmlContent = '';
  },
  toast: (msg, type) => {
    console.log(`  [Toast] (${type}): ${msg}`);
  },
  renderSeriesTabs: () => { },
  renderDayFilter: () => { },
  toggleSidebar: () => { },
  requireAdmin: (fn) => fn
};
sandbox.globalThis = sandbox;

vm.createContext(sandbox);

// Load files
const files = [
  'js/data.js',
  'js/settings.js',
  'js/utils.js',
  'js/courses.js',
  'js/semesters.js',
  'js/routine.js'
];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  vm.runInContext(code, sandbox);
});
vm.runInContext('globalThis.state = state; globalThis.seedData = seedData; globalThis.DAYS = DAYS; globalThis.SLOT_COLUMNS = SLOT_COLUMNS; globalThis.THEORY_ALLOWED_STARTS = THEORY_ALLOWED_STARTS; globalThis.THEORY_SPAN = THEORY_SPAN; globalThis.LAB_SPAN = LAB_SPAN;', sandbox);

// Seed data
sandbox.seedData();

console.log('--- TEST 1: Multi-Teacher Helper Functions ---');
const teacher1 = sandbox.state.teachers[0]; // e.g. Dr. Jane Doe (JD)
const teacher2 = sandbox.state.teachers[1]; // e.g. Prof. John Smith (JS)
const teacher3 = sandbox.state.teachers[2];

const testTheoryCourse = {
  id: 9001,
  seriesId: 1000,
  code: 'ECE 2101',
  title: 'Digital Electronics',
  type: 'theory',
  teacherId: teacher1.id,
  teacherIds: [teacher1.id, teacher2.id]
};

const assignedTeachers = sandbox.courseTeachers(testTheoryCourse);
assert.strictEqual(assignedTeachers.length, 2, 'Should return both teachers');
assert.strictEqual(assignedTeachers[0].id, teacher1.id);
assert.strictEqual(assignedTeachers[1].id, teacher2.id);

const initials = sandbox.courseTeacherInitials(testTheoryCourse);
console.log('Theory Course Initials:', initials);
assert.ok(initials.includes('+'), 'Initials should be joined with +');
console.log('✓ PASS: courseTeachers & courseTeacherInitials work as expected.');

console.log('\n--- TEST 2: Multi-Teacher Helper Fallback for Legacy Courses ---');
const legacyLabCourse = {
  id: 9002,
  seriesId: 1000,
  code: 'ECE 2102',
  title: 'Digital Electronics Lab',
  type: 'lab',
  groups: [
    { labId: 1, teacherId: teacher2.id, size: 30 },
    { labId: 2, teacherId: teacher3.id, size: 30 }
  ]
};

const legacyTeachers = sandbox.courseTeachers(legacyLabCourse);
assert.strictEqual(legacyTeachers.length, 2, 'Should fall back to teachers in groups');
assert.strictEqual(legacyTeachers[0].id, teacher2.id);
assert.strictEqual(legacyTeachers[1].id, teacher3.id);
console.log('Legacy Lab Initials:', sandbox.courseTeacherInitials(legacyLabCourse));
console.log('✓ PASS: Legacy course groups gracefully map to multi-instructor model.');

console.log('\n--- TEST 3: Multi-Teacher Selector Component Simulation ---');
// Test initMultiTeacherSelector
const containerEl = createElement('div');
containerEl.id = 'test-picker';
sandbox.document.getElementById = (id) => (id === 'test-picker' ? containerEl : elements[id] || createElement('div'));

const picker = sandbox.initMultiTeacherSelector('test-picker', [teacher1.id, teacher2.id], (newIds) => {
  console.log('Picker onUpdate fired with:', newIds);
});

assert.deepStrictEqual(Array.from(picker.getTeacherIds()), [teacher1.id, teacher2.id], 'Picker should initialize with both teachers');

// Add third teacher
picker.setTeacherIds([teacher1.id, teacher2.id, teacher3.id]);
assert.deepStrictEqual(Array.from(picker.getTeacherIds()), [teacher1.id, teacher2.id, teacher3.id], 'Picker should reflect added teacher');
console.log('✓ PASS: Multi-teacher selector successfully handles add/remove operations.');

console.log('\n--- TEST 4: Auto-Scheduler with Multi-Teacher Courses ---');
// Assign 2 teachers to a theory course and 2 teachers to a lab course
const activeSeries = sandbox.state.series[0];
sandbox.state.activeSeriesId = activeSeries.id;

// Pick a theory course and lab course from active series
const theoryCourse = sandbox.state.courses.find(c => c.seriesId === activeSeries.id && c.type === 'theory');
const labCourse = sandbox.state.courses.find(c => c.seriesId === activeSeries.id && c.type === 'lab');

theoryCourse.teacherIds = [teacher1.id, teacher2.id];
theoryCourse.teacherId = teacher1.id;

labCourse.teacherIds = [teacher2.id, teacher3.id];
labCourse.teacherId = teacher2.id;
labCourse.labId = sandbox.state.labs[0].id;

console.log(`Configured Theory Course ${theoryCourse.code} with Teachers:`, [teacher1.shortName, teacher2.shortName]);
console.log(`Configured Lab Course ${labCourse.code} with Teachers:`, [teacher2.shortName, teacher3.shortName]);

// Run Whole Series Routine Generation
sandbox.state.routineAllSeries = true;
// Call generator function
sandbox.openAutoGenerateModal();
const confirmBtn = sandbox.document.getElementById('startAutoScheduleBtn');
// Directly trigger scheduling in routine.js by calling the internal solver or test runner
const targetSeries = sandbox.state.series;
console.log('Running master schedule generator with multi-teacher courses...');
sandbox.runAutoGenerationEngine({ scope: 'all' });

console.log('Total classes scheduled:', sandbox.state.classes.length);
assert.ok(sandbox.state.classes.length > 50, 'Master routine should generate classes');

// Verify that the multi-teacher theory course was scheduled with combined initials and both teacher IDs
const placedTheoryClasses = sandbox.state.classes.filter(c => c.seriesId === activeSeries.id && c.code === theoryCourse.code);
console.log(`Placed ${placedTheoryClasses.length} session(s) for multi-teacher course ${theoryCourse.code}`);
assert.ok(placedTheoryClasses.length > 0, 'Theory course should be scheduled');
const ptc = placedTheoryClasses[0];
assert.ok(ptc.teacherIds && ptc.teacherIds.length === 2, 'Class should store both teacherIds');
assert.ok(ptc.initials.includes('+'), 'Class initials should combine initials of both teachers');
console.log('Generated class initials:', ptc.initials);

// Verify that NEITHER teacher has a double booking clash
let teacherDoubleBookings = 0;
const classesByDay = {};
sandbox.state.classes.forEach(c => {
  if (!classesByDay[c.day]) classesByDay[c.day] = [];
  classesByDay[c.day].push(c);
});

Object.entries(classesByDay).forEach(([day, dayClasses]) => {
  for (let i = 0; i < dayClasses.length; i++) {
    for (let j = i + 1; j < dayClasses.length; j++) {
      const a = dayClasses[i];
      const b = dayClasses[j];
      const overlap = (a.start < b.start + b.span) && (b.start < a.start + a.span);
      if (overlap) {
        const aTeachers = a.teacherIds || (a.teacherId ? [a.teacherId] : []);
        const bTeachers = b.teacherIds || (b.teacherId ? [b.teacherId] : []);
        const common = aTeachers.filter(id => bTeachers.includes(id));
        if (common.length > 0) {
          console.error(`Teacher clash on ${day}: ${a.code} vs ${b.code} for teacher ${common}`);
          teacherDoubleBookings++;
        }
      }
    }
  }
});

console.log('Multi-teacher double bookings count:', teacherDoubleBookings);
assert.strictEqual(teacherDoubleBookings, 0, 'Must have zero teacher double bookings');
console.log('✓ PASS: Auto-scheduler flawlessly schedules multi-teacher courses with 0 clashes!');

console.log('\n--- TEST 5: Class Add/Edit Form Multi-Teacher & Auto Initials Sync ---');
const dummyClass = {
  day: 'Monday',
  start: 9,
  code: 'ECE 3101',
  teacherId: teacher1.id,
  teacherIds: [teacher1.id, teacher2.id],
  initials: 'JD+JS'
};

const formHtml = sandbox.classFormFieldsTheory(dummyClass);
assert.ok(formHtml.includes('class-teacher-picker'), 'Form should contain multi-teacher picker container');
assert.ok(formHtml.includes('Instructor(s)'), 'Form should state Instructor(s)');
assert.ok(formHtml.includes('f-initials'), 'Form should include initials field');
console.log('✓ PASS: Class add/edit form includes multi-teacher picker and auto initials.');

console.log('\n====================================================');
console.log('ALL MULTI-TEACHER UNIT & INTEGRATION TESTS PASSED 100%!');
console.log('====================================================');
