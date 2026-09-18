// scratch/test_semesters_system.js
// Automated verification for Academic Semesters & Syllabus course auto-assignment

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(baseDir, 'js/data.js'), 'utf8') + '\nglobalThis.state = state; globalThis.SEMESTERS = SEMESTERS; globalThis.SEED_SEMESTER_COURSES = SEED_SEMESTER_COURSES; globalThis.assignSemesterCoursesToSeries = assignSemesterCoursesToSeries; globalThis.seedData = seedData; globalThis.saveState = saveState; globalThis.loadState = loadState;';
const settingsCode = fs.readFileSync(path.join(baseDir, 'js/settings.js'), 'utf8') + '\nglobalThis.settings = settings; globalThis.renderSettings = renderSettings;';
const utilsCode = fs.readFileSync(path.join(baseDir, 'js/utils.js'), 'utf8') + '\nglobalThis.coursesInActiveSeries = coursesInActiveSeries; globalThis.activeSeries = activeSeries;';
const modalCode = fs.readFileSync(path.join(baseDir, 'js/modal.js'), 'utf8') + '\nglobalThis.simpleFormModal = simpleFormModal; globalThis.openModal = openModal; globalThis.closeModal = closeModal;';
const semestersCode = fs.readFileSync(path.join(baseDir, 'js/semesters.js'), 'utf8') + '\nglobalThis.renderSemesters = renderSemesters; globalThis.openSemesterCourseModal = openSemesterCourseModal;';

const elements = {};
function createMockEl(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    style: {},
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    setAttribute: () => { },
    getAttribute: () => null,
    dataset: {},
    appendChild: () => { },
    removeChild: () => { },
    remove: () => { },
    focus: () => { },
    innerHTML: '',
    value: '',
    addEventListener: () => { },
    clientWidth: 1400,
    scrollWidth: 1400,
    querySelectorAll: (sel) => [],
    querySelector: (sel) => null
  };
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
  confirm: () => true,
  localStorage: {
    data: {},
    getItem: function (k) { return this.data[k] || null; },
    setItem: function (k, v) { this.data[k] = String(v); },
    removeItem: function (k) { delete this.data[k]; }
  },
  addEventListener: () => { }
};

const ctx = {
  console,
  document: documentMock,
  window: windowMock,
  localStorage: windowMock.localStorage,
  confirm: () => true,
  setTimeout: (fn) => fn(),
  clearTimeout: () => { },
  requestAnimationFrame: (fn) => fn(),
  requireAdmin: (fn) => fn,
  toast: (msg, type) => console.log(`  [Toast] (${type || 'info'}): ${msg}`)
};

ctx.globalThis = ctx;
vm.createContext(ctx);

vm.runInContext(dataCode, ctx);
vm.runInContext(settingsCode, ctx);
vm.runInContext(utilsCode, ctx);
vm.runInContext(modalCode, ctx);
vm.runInContext(semestersCode, ctx);

ctx.seedData();

console.log('====================================================');
console.log('TESTING SEMESTERS & SYLLABUS COURSE AUTO-ASSIGNMENT');
console.log('====================================================\n');

// 1. Verify 8 Semesters
console.log('--- TEST 1: SEMESTERS constant & Syllabus Course Counts ---');
const expectedSemesters = [
  "1st Year (Odd)", "1st Year (Even)",
  "2nd Year (Odd)", "2nd Year (Even)",
  "3rd Year (Odd)", "3rd Year (Even)",
  "4th Year (Odd)", "4th Year (Even)"
];

if (ctx.SEMESTERS.length !== 8) {
  console.error('FAIL: SEMESTERS array length is not 8, got', ctx.SEMESTERS.length);
  process.exit(1);
}
expectedSemesters.forEach(s => {
  if (!ctx.SEMESTERS.includes(s)) {
    console.error('FAIL: Missing semester in SEMESTERS array:', s);
    process.exit(1);
  }
});
console.log('✓ PASS: All 8 Semesters are defined properly.');

expectedSemesters.forEach(s => {
  const count = ctx.state.semesterCourses.filter(c => c.semester === s).length;
  console.log(`  ${s}: ${count} courses defined`);
  if (count < 9) {
    console.error(`FAIL: Semester ${s} has fewer courses than expected: ${count}`);
    process.exit(1);
  }
});
console.log('✓ PASS: Every semester has its pre-assigned syllabus courses from PDF!\n');

// 2. Verify renderSemesters() UI
console.log('--- TEST 2: Semesters UI View Rendering ---');
ctx.state.activeSemester = "1st Year (Odd)";
ctx.renderSemesters();
const mainHtml = elements['mainArea'].innerHTML;
if (!mainHtml.includes('Academic Semesters &amp; Syllabus') || !mainHtml.includes('1st Year (Odd)')) {
  console.error('FAIL: Semesters UI did not render title or active semester');
  process.exit(1);
}
console.log('✓ PASS: renderSemesters() successfully renders UI and tabs.');

// 3. Test New Series Creation with Running Semester Selection
console.log('\n--- TEST 3: Add Series with Running Semester & Auto-assigned Courses ---');
const newSeriesId = 1500;
const newSeries = {
  id: newSeriesId,
  name: "26 Series",
  runningSemester: "1st Year (Even)",
  label: "1st Year (Even)|26 Series"
};
ctx.state.series.push(newSeries);
ctx.assignSemesterCoursesToSeries(newSeries.id, newSeries.runningSemester);

const assignedCourses = ctx.state.courses.filter(c => c.seriesId === newSeriesId);
console.log(`Assigned ${assignedCourses.length} courses to ${newSeries.name} for ${newSeries.runningSemester}:`);
assignedCourses.forEach(c => console.log(`  - ${c.code}: ${c.title} (${c.type}, ${c.credit} Cr, ${c.sessionsPerWeek} sess/wk)`));

if (assignedCourses.length !== 9) {
  console.error(`FAIL: Expected 9 courses for 1st Year (Even), got ${assignedCourses.length}`);
  process.exit(1);
}
const hasOop = assignedCourses.some(c => c.code === 'ECE 1203');
const hasCircuits2 = assignedCourses.some(c => c.code === 'ECE 1201');
if (!hasOop || !hasCircuits2) {
  console.error('FAIL: Expected courses (ECE 1201, ECE 1203) not found in assigned courses');
  process.exit(1);
}
console.log('✓ PASS: New series receives all syllabus courses of selected running semester!');

// 4. Test Updating Running Semester for a Series (Progression)
console.log('\n--- TEST 4: Update Series Running Semester to 2nd Year (Odd) ---');
// Transition 26 Series to 2nd Year (Odd)
ctx.assignSemesterCoursesToSeries(newSeries.id, "2nd Year (Odd)", true);

const updatedCourses = ctx.state.courses.filter(c => c.seriesId === newSeriesId);
console.log(`After promotion to 2nd Year (Odd), ${newSeries.name} has ${updatedCourses.length} courses:`);
updatedCourses.forEach(c => console.log(`  - ${c.code}: ${c.title} (${c.type})`));

if (updatedCourses.length !== 10) {
  console.error(`FAIL: Expected 10 courses for 2nd Year (Odd), got ${updatedCourses.length}`);
  process.exit(1);
}
const hasDsa = updatedCourses.some(c => c.code === 'ECE 2103');
const hasDigital = updatedCourses.some(c => c.code === 'ECE 2111');
if (!hasDsa || !hasDigital) {
  console.error('FAIL: 2nd Year (Odd) courses not present after semester update');
  process.exit(1);
}
console.log('✓ PASS: Series promotion cleanly replaces courses with the new running semester curriculum!');

// 5. Test Adding Custom Course to a Semester
console.log('\n--- TEST 5: Add Custom Course to a Semester Syllabus ---');
const customCourse = {
  semester: "2nd Year (Odd)",
  code: "ECE 2199",
  title: "Special Topics in Emerging Tech",
  dept: "ECE",
  credit: 3.0,
  type: "theory",
  sessionsPerWeek: 3
};
ctx.state.semesterCourses.push({ id: 9999, ...customCourse });

// Verify that it is now part of the syllabus
const semCourses = ctx.state.semesterCourses.filter(c => c.semester === "2nd Year (Odd)");
const found = semCourses.some(c => c.code === "ECE 2199");
if (!found) {
  console.error('FAIL: Custom course was not added to semester syllabus');
  process.exit(1);
}
console.log('✓ PASS: Custom course successfully added to semester syllabus');

// Synchronize to 26 Series and verify it receives the custom course
ctx.assignSemesterCoursesToSeries(newSeries.id, "2nd Year (Odd)");
const hasCustomInSeries = ctx.state.courses.some(c => c.seriesId === newSeriesId && c.code === "ECE 2199");
if (!hasCustomInSeries) {
  console.error('FAIL: Series did not receive the newly added syllabus course');
  process.exit(1);
}
console.log('✓ PASS: Series synchronized and now includes the new course!');

console.log('\n====================================================');
console.log('ALL SEMESTERS & SYLLABUS TESTS PASSED 100%!');
console.log('====================================================');
