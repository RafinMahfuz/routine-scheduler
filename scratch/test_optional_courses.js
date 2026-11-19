// scratch/test_optional_courses.js
// Verification for 4th Year Optional Elective Courses in Semesters & Courses views

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const baseDir = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(baseDir, 'js/data.js'), 'utf8') + '\nglobalThis.state = state; globalThis.SEMESTERS = SEMESTERS; globalThis.SEED_SEMESTER_COURSES = SEED_SEMESTER_COURSES; globalThis.OPTIONAL_COURSES = OPTIONAL_COURSES; globalThis.assignSemesterCoursesToSeries = assignSemesterCoursesToSeries; globalThis.seedData = seedData; globalThis.saveState = saveState; globalThis.loadState = loadState;';
const utilsCode = fs.readFileSync(path.join(baseDir, 'js/utils.js'), 'utf8') + '\nglobalThis.coursesInActiveSeries = coursesInActiveSeries; globalThis.activeSeries = activeSeries; globalThis.courseTeachers = courseTeachers; globalThis.teacherShort = teacherShort; globalThis.roomById = roomById; globalThis.labById = labById;';
const crudCode = fs.readFileSync(path.join(baseDir, 'js/crud.js'), 'utf8') + '\nglobalThis.crudPage = crudPage;';
const navCode = fs.readFileSync(path.join(baseDir, 'js/nav.js'), 'utf8') + '\nglobalThis.renderSeriesTabs = renderSeriesTabs;';
const semestersCode = fs.readFileSync(path.join(baseDir, 'js/semesters.js'), 'utf8') + '\nglobalThis.renderSemesters = renderSemesters;';
const coursesCode = fs.readFileSync(path.join(baseDir, 'js/courses.js'), 'utf8') + '\nglobalThis.renderCourses = renderCourses;';

const elements = {};
function createMockEl(tag = 'div') {
  let innerHtmlVal = '';
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    setAttribute: (k, v) => { el.attributes[k] = v; if (k.startsWith('data-')) el.dataset[k.replace('data-', '')] = v; },
    getAttribute: (k) => el.attributes[k] || null,
    attributes: {},
    dataset: {},
    children: [],
    appendChild: (child) => { el.children.push(child); return child; },
    removeChild: () => { },
    remove: () => { },
    focus: () => { },
    get innerHTML() { return innerHtmlVal; },
    set innerHTML(val) { innerHtmlVal = val; el.children = []; },
    value: '',
    addEventListener: () => { },
    clientWidth: 1400,
    scrollWidth: 1400,
    querySelectorAll: (sel) => {
      const results = [];
      function findMatches(node) {
        if (!node) return;
        if (sel === '[data-sem-tab]' && node.dataset && node.dataset.semTab) results.push(node);
        if (sel === '[data-edit]' && node.dataset && node.dataset.edit) results.push(node);
        if (sel === '[data-add-elective]' && node.dataset && node.dataset.addElective) results.push(node);
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
vm.runInContext(utilsCode, ctx);
vm.runInContext(crudCode, ctx);
vm.runInContext(navCode, ctx);
vm.runInContext(semestersCode, ctx);
vm.runInContext(coursesCode, ctx);

ctx.seedData();

console.log('====================================================');
console.log('TESTING 4TH YEAR OPTIONAL (ELECTIVE) COURSES SYSTEM');
console.log('====================================================\n');

// 1. Verify OPTIONAL_COURSES Data Structure
console.log('--- TEST 1: OPTIONAL_COURSES Constant Structure & Integrity ---');
assert.ok(ctx.OPTIONAL_COURSES, 'OPTIONAL_COURSES must exist in js/data.js');
assert.ok(ctx.OPTIONAL_COURSES['4th Year (Odd)'], '4th Year (Odd) optional courses must exist');
assert.ok(ctx.OPTIONAL_COURSES['4th Year (Even)'], '4th Year (Even) optional courses must exist');

const oddGroups = ctx.OPTIONAL_COURSES['4th Year (Odd)'];
assert.strictEqual(oddGroups.length, 2, '4th Year (Odd) must have exactly 2 groups: Optional I & Optional II');
assert.strictEqual(oddGroups[0].group, 'Optional I');
assert.strictEqual(oddGroups[0].courses.length, 12, 'Optional I must have 12 courses (6 theory + 6 lab)');
assert.strictEqual(oddGroups[1].group, 'Optional II');
assert.strictEqual(oddGroups[1].courses.length, 10, 'Optional II must have 10 courses (5 theory + 5 lab)');

const evenGroups = ctx.OPTIONAL_COURSES['4th Year (Even)'];
assert.strictEqual(evenGroups.length, 2, '4th Year (Even) must have exactly 2 groups: Optional III & Optional IV');
assert.strictEqual(evenGroups[0].group, 'Optional III');
assert.strictEqual(evenGroups[0].courses.length, 14, 'Optional III must have 14 courses (7 theory + 7 lab)');
assert.strictEqual(evenGroups[1].group, 'Optional IV');
assert.strictEqual(evenGroups[1].courses.length, 14, 'Optional IV must have 14 courses (7 theory + 7 lab)');

console.log('✓ PASS: Optional I has 12 courses, Optional II has 10 courses');
console.log('✓ PASS: Optional III has 14 courses, Optional IV has 14 courses (Total 50 elective courses matching syllabus PDF)');

// 2. Verify SEED_SEMESTER_COURSES Main Courses
console.log('\n--- TEST 2: SEED_SEMESTER_COURSES Placeholders for 4th Year ---');
const fourthOdd = ctx.SEED_SEMESTER_COURSES.filter(c => c.semester === '4th Year (Odd)');
assert.strictEqual(fourthOdd.length, 12, '4th Year (Odd) must have 12 main courses');
assert.ok(fourthOdd.some(c => c.code === 'ECE 41**' && c.title === 'Optional I'), 'Must have ECE 41** Optional I');
assert.ok(fourthOdd.some(c => c.code === 'ECE 41**' && c.title === 'Optional I Sessional'), 'Must have ECE 41** Optional I Sessional');
assert.ok(fourthOdd.some(c => c.code === 'ECE 41**' && c.title === 'Optional II'), 'Must have ECE 41** Optional II');
assert.ok(fourthOdd.some(c => c.code === 'ECE 41**' && c.title === 'Optional II Sessional'), 'Must have ECE 41** Optional II Sessional');
assert.ok(!fourthOdd.some(c => c.code === 'ECE 4111'), 'Must not auto-assign specific optional course ECE 4111 in main table');
assert.ok(!fourthOdd.some(c => c.code === 'ECE 4127'), 'Must not auto-assign specific optional course ECE 4127 in main table');

const fourthEven = ctx.SEED_SEMESTER_COURSES.filter(c => c.semester === '4th Year (Even)');
assert.strictEqual(fourthEven.length, 10, '4th Year (Even) must have 10 main courses');
assert.ok(fourthEven.some(c => c.code === 'ECE 42**' && c.title === 'Optional III'), 'Must have ECE 42** Optional III');
assert.ok(fourthEven.some(c => c.code === 'ECE 42**' && c.title === 'Optional III Sessional'), 'Must have ECE 42** Optional III Sessional');
assert.ok(fourthEven.some(c => c.code === 'ECE 42**' && c.title === 'Optional IV'), 'Must have ECE 42** Optional IV');
assert.ok(fourthEven.some(c => c.code === 'ECE 42**' && c.title === 'Optional IV Sessional'), 'Must have ECE 42** Optional IV Sessional');
assert.ok(!fourthEven.some(c => c.code === 'ECE 4221'), 'Must not auto-assign specific optional course ECE 4221 in main table');
assert.ok(!fourthEven.some(c => c.code === 'ECE 4251'), 'Must not auto-assign specific optional course ECE 4251 in main table');

console.log('✓ PASS: Main courses for 4th Year Odd & Even use exact ECE 41** and ECE 42** Optional placeholders!');

// 3. Verify Semesters UI & Optional Catalog
console.log('\n--- TEST 3: Semesters UI Optional Catalog Rendering ---');
// 3a. 4th Year Odd
ctx.state.activeSemester = '4th Year (Odd)';
ctx.renderSemesters();
const semCatalogEl = elements['semOptionalCatalog'];
assert.strictEqual(semCatalogEl.style.display, 'block', 'Optional catalog must be visible for 4th Year (Odd)');
assert.ok(semCatalogEl.innerHTML.includes('Optional Elective Courses Catalog (4th Year (Odd))'), 'Catalog title rendered');
assert.ok(semCatalogEl.innerHTML.includes('Optional I'), 'Contains Optional I');
assert.ok(semCatalogEl.innerHTML.includes('Optional II'), 'Contains Optional II');
assert.ok(semCatalogEl.innerHTML.includes('ECE 4111'), 'Contains ECE 4111 in Optional I');
assert.ok(semCatalogEl.innerHTML.includes('ECE 4127'), 'Contains ECE 4127 in Optional II');

// 3b. 4th Year Even
ctx.state.activeSemester = '4th Year (Even)';
ctx.renderSemesters();
assert.strictEqual(semCatalogEl.style.display, 'block', 'Optional catalog must be visible for 4th Year (Even)');
assert.ok(semCatalogEl.innerHTML.includes('Optional Elective Courses Catalog (4th Year (Even))'), 'Catalog title rendered');
assert.ok(semCatalogEl.innerHTML.includes('Optional III'), 'Contains Optional III');
assert.ok(semCatalogEl.innerHTML.includes('Optional IV'), 'Contains Optional IV');
assert.ok(semCatalogEl.innerHTML.includes('ECE 4221'), 'Contains ECE 4221 in Optional III');
assert.ok(semCatalogEl.innerHTML.includes('ECE 4247'), 'Contains ECE 4247 in Optional IV');

// 3c. 1st Year Odd (No optional courses)
ctx.state.activeSemester = '1st Year (Odd)';
ctx.renderSemesters();
assert.strictEqual(semCatalogEl.style.display, 'none', 'Optional catalog must be hidden for 1st Year (Odd)');
console.log('✓ PASS: Semesters view dynamically displays the optional courses catalog for 4th Year Odd & Even, and hides for others!');

// 4. Verify Courses View Bottom Elective Options
console.log('\n--- TEST 4: Courses Page Elective Section for Active Series ---');
// 4a. 21 Series running 4th Year (Odd)
const series21 = ctx.state.series.find(s => s.name === '21 Series');
assert.ok(series21, '21 Series must exist');
ctx.state.activeSeriesId = series21.id;
ctx.assignSemesterCoursesToSeries(series21.id, '4th Year (Odd)');

ctx.renderCourses();
const mainArea = elements['mainArea'];
const coursesOptSection = mainArea.children.find(child => child.id === 'seriesOptionalCoursesSection');
assert.ok(coursesOptSection, 'seriesOptionalCoursesSection must be appended in mainArea for 21 Series');
assert.ok(coursesOptSection.innerHTML.includes('Optional Elective Course Options (21 Series — 4th Year (Odd))'), 'Contains options header for 21 Series');
assert.ok(coursesOptSection.innerHTML.includes('ECE 4111'), 'Contains ECE 4111 option');
assert.ok(coursesOptSection.innerHTML.includes('ECE 4127'), 'Contains ECE 4127 option');

// 4b. Non-4th year series (e.g. 25 Series running 1st Year (Odd))
const series25 = ctx.state.series.find(s => s.name === '25 Series');
assert.ok(series25, '25 Series must exist');
ctx.state.activeSeriesId = series25.id;
ctx.renderCourses();
const coursesOptSection25 = mainArea.children.find(child => child.id === 'seriesOptionalCoursesSection');
assert.ok(!coursesOptSection25, 'seriesOptionalCoursesSection must NOT be rendered for 25 Series (1st Year Odd)');

console.log('✓ PASS: Courses page displays the elective options at the bottom only for 4th Year series!');

// 5. Verify loadState() Auto-Upgrade Migration
console.log('\n--- TEST 5: loadState() Auto-Upgrade for Legacy Data ---');
const legacyPayload = {
  state: {
    ...ctx.state,
    semesterCourses: [
      { id: 9901, semester: "4th Year (Odd)", code: "ECE 4111", title: "Digital Communication", credit: 3, type: "theory" },
      { id: 9902, semester: "4th Year (Odd)", code: "ECE 4127", title: "VLSI Design", credit: 3, type: "theory" }
    ]
  },
  settings: {},
  uid: 2000
};
ctx.localStorage.setItem('routineSchedulerData_v6', JSON.stringify(legacyPayload));
const loadResult = ctx.loadState();
assert.strictEqual(loadResult, true, 'loadState should return true');
const reloaded4thOdd = ctx.state.semesterCourses.filter(c => c.semester === '4th Year (Odd)');
assert.ok(reloaded4thOdd.some(c => c.code === 'ECE 41**' && c.title === 'Optional I'), 'Legacy data upgraded to ECE 41** Optional I');
assert.ok(!reloaded4thOdd.some(c => c.code === 'ECE 4111'), 'Old hardcoded ECE 4111 removed from core table');
console.log('✓ PASS: Legacy saved data cleanly auto-upgrades to syllabus placeholders!');

console.log('\n====================================================');
console.log('ALL 4TH YEAR OPTIONAL COURSES TESTS PASSED 100%!');
console.log('====================================================');
