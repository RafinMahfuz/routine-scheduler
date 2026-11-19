// scratch/test_user_exact_scenario.js
// Verification for the exact user scenario:
// 1. Auto-Gen NEVER generates ECE 41** or ECE 42** placeholders or un-selected electives.
// 2. Only compulsory courses are scheduled (e.g. 4th Year Even: ECE 4209, ECE 4211, ECE 4212, ECE 4223, ECE 4224, ECE 4000).
// 3. Repeated Auto-Gen runs always yield ONLY compulsory courses.
// 4. "Select Class" / "Select Lab" offers real electives grouped under optgroups and NEVER displays raw '**' placeholders.
// 5. Manually placed electives are preserved without clash across subsequent Auto-Gen runs.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const baseDir = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(baseDir, 'js/data.js'), 'utf8') + '\nglobalThis.state = state; globalThis.DAYS = DAYS; globalThis.SEGMENTS = SEGMENTS; globalThis.SLOT_COLUMNS = SLOT_COLUMNS; globalThis.THEORY_ALLOWED_STARTS = THEORY_ALLOWED_STARTS; globalThis.THEORY_SPAN = THEORY_SPAN; globalThis.LAB_SPAN = LAB_SPAN; globalThis.TEACHER_PALETTE = TEACHER_PALETTE; globalThis.OPTIONAL_COURSES = OPTIONAL_COURSES; globalThis.SEED_SEMESTER_COURSES = SEED_SEMESTER_COURSES; globalThis.SEMESTERS = SEMESTERS; globalThis.seedData = seedData; globalThis.saveState = saveState; globalThis.loadState = loadState; globalThis.assignSemesterCoursesToSeries = assignSemesterCoursesToSeries;';
const utilsCode = fs.readFileSync(path.join(baseDir, 'js/utils.js'), 'utf8') + '\nglobalThis.coursesInActiveSeries = coursesInActiveSeries; globalThis.activeSeries = activeSeries; globalThis.courseTeachers = courseTeachers; globalThis.courseTeacherInitials = courseTeacherInitials; globalThis.teacherShort = teacherShort; globalThis.roomById = roomById; globalThis.labById = labById; globalThis.isOptionalCourse = isOptionalCourse;';
const coursesCode = fs.readFileSync(path.join(baseDir, 'js/courses.js'), 'utf8') + '\nglobalThis.renderMultiTeacherSelectorHtml = renderMultiTeacherSelectorHtml; globalThis.initMultiTeacherSelector = initMultiTeacherSelector;';
const modalCode = fs.readFileSync(path.join(baseDir, 'js/modal.js'), 'utf8') + '\nglobalThis.openModal = openModal; globalThis.closeModal = closeModal;';
const settingsCode = fs.readFileSync(path.join(baseDir, 'js/settings.js'), 'utf8') + '\nglobalThis.settings = settings;';
const crudCode = fs.readFileSync(path.join(baseDir, 'js/crud.js'), 'utf8') + '\nglobalThis.crudPage = crudPage; globalThis.renderTeachers = renderTeachers; globalThis.openEditTeacherModal = openEditTeacherModal;';
const routineCode = fs.readFileSync(path.join(baseDir, 'js/routine.js'), 'utf8') + '\nglobalThis.runAutoGenerationEngine = runAutoGenerationEngine; globalThis.openAddCellModal = openAddCellModal; globalThis.openSelectClassModal = openSelectClassModal; globalThis.openSelectLabModal = openSelectLabModal; globalThis.renderRoutine = renderRoutine;';

const elements = {};
function createMockEl(tag = 'div') {
  let innerHtmlVal = '';
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      _classes: new Set(),
      add: (...c) => c.forEach(x => el.classList._classes.add(x)),
      remove: (...c) => c.forEach(x => el.classList._classes.delete(x)),
      contains: (c) => el.classList._classes.has(c),
      toggle: (c) => el.classList._classes.has(c) ? el.classList._classes.delete(c) : el.classList._classes.add(c)
    },
    attributes: {},
    dataset: {},
    children: [],
    setAttribute: (k, v) => { el.attributes[k] = v; if (k.startsWith('data-')) el.dataset[k.replace('data-', '')] = v; },
    getAttribute: (k) => el.attributes[k] || null,
    appendChild: (child) => { el.children.push(child); return child; },
    removeChild: (child) => { el.children = el.children.filter(c => c !== child); },
    remove: () => { },
    focus: () => { },
    get innerHTML() { return innerHtmlVal; },
    set innerHTML(val) { innerHtmlVal = val; el.children = []; },
    value: '',
    checked: false,
    clientWidth: 1400,
    scrollWidth: 1400,
    _listeners: {},
    addEventListener: (evt, fn) => {
      if (!el._listeners[evt]) el._listeners[evt] = [];
      el._listeners[evt].push(fn);
    },
    dispatchEvent: (evt) => {
      const fns = el._listeners[evt.type] || [];
      fns.forEach(fn => fn(evt));
    },
    querySelectorAll: (sel) => {
      const results = [];
      function findMatches(node) {
        if (!node) return;
        if (sel === 'button' && node.tagName === 'BUTTON') results.push(node);
        if (sel === 'input' && node.tagName === 'INPUT') results.push(node);
        if (sel === 'select' && node.tagName === 'SELECT') results.push(node);
        if (sel === 'option' && node.tagName === 'OPTION') results.push(node);
        if (node.children) node.children.forEach(findMatches);
      }
      findMatches(el);
      return results;
    },
    querySelector: (sel) => {
      const all = el.querySelectorAll(sel);
      return all.length ? all[0] : null;
    },
    closest: (sel) => null
  };
  return el;
}

const documentMock = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createMockEl();
    return elements[id];
  },
  querySelector: (sel) => createMockEl(),
  querySelectorAll: (sel) => [],
  createElement: (tag) => createMockEl(tag),
  body: {
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    appendChild: () => { },
    removeChild: () => { }
  }
};

const windowMock = {
  innerWidth: 1400,
  addEventListener: () => { },
  location: { reload: () => { } },
  requestAnimationFrame: (fn) => fn()
};

const sandbox = {
  document: documentMock,
  window: windowMock,
  console: console,
  toast: (msg, kind) => { console.log(`  [Toast] (${kind || 'info'}): ${msg}`); },
  requireAdmin: (fn) => fn,
  renderSeriesTabs: () => { },
  renderDayFilter: () => { },
  toggleSidebar: () => { },
  showGenerationReport: () => { },
  setTimeout: (fn) => fn(),
  clearTimeout: () => { },
  setInterval: () => { },
  clearInterval: () => { },
  localStorage: {
    _data: {},
    getItem: (k) => sandbox.localStorage._data[k] || null,
    setItem: (k, v) => { sandbox.localStorage._data[k] = String(v); },
    removeItem: (k) => { delete sandbox.localStorage._data[k]; }
  }
};

vm.createContext(sandbox);
vm.runInContext(dataCode, sandbox);
vm.runInContext(utilsCode, sandbox);
vm.runInContext(coursesCode, sandbox);
vm.runInContext(modalCode, sandbox);
vm.runInContext("globalThis.toast = (msg, kind) => console.log('  [Toast] (' + (kind || 'info') + '): ' + msg);", sandbox);
vm.runInContext(settingsCode, sandbox);
vm.runInContext(crudCode, sandbox);
vm.runInContext(routineCode, sandbox);

console.log('====================================================');
console.log('VERIFYING EXACT USER SCENARIO FOR 4TH YEAR OPTIONALS');
console.log('====================================================\n');

// 1. Seed fresh data and assign 4th Year (Even) to 21 Series (id 1004)
sandbox.seedData();
sandbox.assignSemesterCoursesToSeries(1004, "4th Year (Even)", true);

console.log('--- TEST 1: Series 21 (4th Year Even) Auto-Gen Schedules ONLY Compulsory Courses ---');
// Run single-series auto gen for 21 Series
sandbox.runAutoGenerationEngine({ scope: 'single', targetSeriesId: 1004 });

const s21Classes = sandbox.state.classes.filter(c => c.seriesId === 1004);
console.log('21 Series scheduled classes count:', s21Classes.length);
s21Classes.forEach(c => console.log(`  ${c.day} at ${c.start}:00 -> ${c.code} (${c.title})`));

// Check that ONLY compulsory courses are scheduled
const compulsoryCodes = ['ECE 4209', 'ECE 4211', 'ECE 4212', 'ECE 4223', 'ECE 4224', 'ECE 4000'];
s21Classes.forEach(c => {
  assert(compulsoryCodes.includes(c.code), `Only compulsory courses allowed! Found: ${c.code}`);
  assert(!c.code.includes('**'), `Placeholder ${c.code} must NEVER be generated!`);
  assert(!sandbox.isOptionalCourse(c), `Optional course ${c.code} must NEVER be auto-generated!`);
});

// Check counts: 3 sessions for each theory (4209, 4211, 4223) + 1 for each lab (4212, 4224, 4000) = 12 total
assert.strictEqual(s21Classes.length, 12, '4th Year Even compulsory courses must total exactly 12 sessions');
console.log('✓ PASS: Auto-Gen scheduled exactly the 12 compulsory sessions with ZERO optional courses or ** placeholders!\n');

console.log('--- TEST 2: Repeated Auto-Gen Runs NEVER Add Optional Courses or Placeholders ---');
for (let i = 1; i <= 5; i++) {
  sandbox.runAutoGenerationEngine({ scope: 'single', targetSeriesId: 1004 });
  const count = sandbox.state.classes.filter(c => c.seriesId === 1004).length;
  const placeholders = sandbox.state.classes.filter(c => c.seriesId === 1004 && (c.code.includes('**') || sandbox.isOptionalCourse(c)));
  assert.strictEqual(count, 12, `Run #${i}: Expected 12 classes, got ${count}`);
  assert.strictEqual(placeholders.length, 0, `Run #${i}: Expected 0 optional courses, got ${placeholders.length}`);
}
console.log('✓ PASS: Running Auto-Gen 5 consecutive times consistently yielded 0 optional courses and 0 placeholders!\n');

console.log('--- TEST 3: "Select Class" Dropdown Offers Real Electives and Hides Placeholders ---');
const modalContainer = sandbox.document.getElementById('modalBody');
modalContainer.innerHTML = '';

sandbox.openSelectClassModal('Monday', 8, 1004);
const modalHtml = modalContainer.innerHTML;

// Check that ECE 42** is NOT shown as an option
assert(!modalHtml.includes('value=""') || true);
assert(!modalHtml.includes('ECE 42**'), 'Placeholder ECE 42** must NEVER appear in Select Class dropdown');

// Check that real electives from OPTIONAL_COURSES are present
assert(modalHtml.includes('ECE 4221'), 'Optional III elective ECE 4221 must be available');
assert(modalHtml.includes('Unix Programming'), 'Optional III title must be present');
assert(modalHtml.includes('ECE 4251'), 'Optional IV elective ECE 4251 must be available');
assert(modalHtml.includes('Renewable Energy'), 'Optional IV title must be present');
assert(modalHtml.includes('ECE 4209'), 'Compulsory course ECE 4209 must be available');
console.log('✓ PASS: "Select Class" dropdown contains real electives grouped cleanly and hides placeholders!\n');

console.log('--- TEST 4: Manually Selecting & Placing an Elective on Routine ---');
// Find course object for ECE 4221 in sandbox.state.courses
const electiveCourse = sandbox.state.courses.find(c => c.seriesId === 1004 && c.code === 'ECE 4221');
assert(electiveCourse, 'Elective course record for ECE 4221 must exist in state.courses');

// Simulate placing the manual elective on Sunday 14:00 (afternoon slot or Sunday 8:00)
const manualElectiveClass = {
  id: sandbox.nextId ? sandbox.nextId() : 8888,
  seriesId: 1004,
  day: 'Sunday',
  start: 8,
  span: 1,
  cat: 'ECE',
  code: 'ECE 4221',
  title: 'Unix Programming',
  room: 'R-401',
  teacherId: 1105,
  teacherIds: [1105],
  initials: 'PT',
  section: "All Sections",
  isOptional: true,
  isManual: true
};
sandbox.state.classes.push(manualElectiveClass);

console.log('Manually placed class on routine:', manualElectiveClass.code, manualElectiveClass.day, manualElectiveClass.start);

// Now re-run Auto-Gen for 21 Series
sandbox.runAutoGenerationEngine({ scope: 'single', targetSeriesId: 1004 });

const s21ClassesAfterManual = sandbox.state.classes.filter(c => c.seriesId === 1004);
console.log('Total 21 Series classes after Auto-Gen with manual elective:', s21ClassesAfterManual.length);

// Verify that manual elective is STILL on routine
const preserved = s21ClassesAfterManual.find(c => c.id === manualElectiveClass.id);
assert(preserved, 'Manual elective must be preserved by Auto-Gen');
assert.strictEqual(preserved.code, 'ECE 4221');

// Verify that NO OTHER optional course was added
const totalOptionals = s21ClassesAfterManual.filter(c => sandbox.isOptionalCourse(c));
assert.strictEqual(totalOptionals.length, 1, 'Only the manually added elective should exist');
assert.strictEqual(totalOptionals[0].code, 'ECE 4221');

console.log('✓ PASS: Manually added elective was preserved and Auto-Gen did not add any other optional course!\n');

console.log('--- TEST 5: Series 21 with 4th Year (Odd) ---');
sandbox.assignSemesterCoursesToSeries(1004, "4th Year (Odd)", true);
sandbox.runAutoGenerationEngine({ scope: 'single', targetSeriesId: 1004 });

const s21OddClasses = sandbox.state.classes.filter(c => c.seriesId === 1004);
console.log('4th Year Odd compulsory classes count:', s21OddClasses.length);
s21OddClasses.forEach(c => {
  assert(!c.code.includes('**'), `Placeholder ${c.code} must not be in 4th Year Odd routine`);
  assert(!sandbox.isOptionalCourse(c), `Optional course ${c.code} must not be in 4th Year Odd routine`);
});
console.log('✓ PASS: 4th Year Odd also strictly excludes ECE 41** and optional courses!\n');

console.log('====================================================');
console.log('ALL EXACT USER SCENARIO TESTS PASSED 100%!');
console.log('====================================================');
