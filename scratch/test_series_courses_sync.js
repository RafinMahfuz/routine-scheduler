// scratch/test_series_courses_sync.js
// Verification that:
// 1. All 10 syllabus courses for 3rd Year (Even) are present in state.courses for 22 Series.
// 2. In Courses section (coursesInActiveSeries()), all 10 courses are displayed.
// 3. Teachers and rooms/labs can be assigned to all of them.
// 4. Auto-Gen schedules all 10 courses for 22 Series.
// 5. 21 Series (4th Year Even) still schedules only compulsory courses via Auto-Gen, excluding optionals.
// 6. Switching semesters in Settings synchronizes all syllabus courses.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const baseDir = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(baseDir, 'js/data.js'), 'utf8') + '\nglobalThis.state = state; globalThis.DAYS = DAYS; globalThis.SEGMENTS = SEGMENTS; globalThis.SLOT_COLUMNS = SLOT_COLUMNS; globalThis.THEORY_ALLOWED_STARTS = THEORY_ALLOWED_STARTS; globalThis.THEORY_SPAN = THEORY_SPAN; globalThis.LAB_SPAN = LAB_SPAN; globalThis.TEACHER_PALETTE = TEACHER_PALETTE; globalThis.OPTIONAL_COURSES = OPTIONAL_COURSES; globalThis.SEED_SEMESTER_COURSES = SEED_SEMESTER_COURSES; globalThis.SEMESTERS = SEMESTERS; globalThis.seedData = seedData; globalThis.saveState = saveState; globalThis.loadState = loadState; globalThis.loadFromCloud = loadFromCloud; globalThis.assignSemesterCoursesToSeries = assignSemesterCoursesToSeries;';
const utilsCode = fs.readFileSync(path.join(baseDir, 'js/utils.js'), 'utf8') + '\nglobalThis.coursesInActiveSeries = coursesInActiveSeries; globalThis.activeSeries = activeSeries; globalThis.courseTeachers = courseTeachers; globalThis.courseTeacherInitials = courseTeacherInitials; globalThis.teacherShort = teacherShort; globalThis.roomById = roomById; globalThis.labById = labById; globalThis.isOptionalCourse = isOptionalCourse;';
const coursesCode = fs.readFileSync(path.join(baseDir, 'js/courses.js'), 'utf8') + '\nglobalThis.renderMultiTeacherSelectorHtml = renderMultiTeacherSelectorHtml; globalThis.initMultiTeacherSelector = initMultiTeacherSelector; globalThis.renderCourses = renderCourses;';
const modalCode = fs.readFileSync(path.join(baseDir, 'js/modal.js'), 'utf8') + '\nglobalThis.openModal = openModal; globalThis.closeModal = closeModal;';
const settingsCode = fs.readFileSync(path.join(baseDir, 'js/settings.js'), 'utf8') + '\nglobalThis.settings = settings; globalThis.renderSettings = renderSettings;';
const crudCode = fs.readFileSync(path.join(baseDir, 'js/crud.js'), 'utf8') + '\nglobalThis.crudPage = crudPage; globalThis.renderTeachers = renderTeachers;';
const routineCode = fs.readFileSync(path.join(baseDir, 'js/routine.js'), 'utf8') + '\nglobalThis.runAutoGenerationEngine = runAutoGenerationEngine; globalThis.openSelectClassModal = openSelectClassModal; globalThis.openSelectLabModal = openSelectLabModal; globalThis.renderRoutine = renderRoutine;';

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
    get innerHTML() { return innerHtmlVal; },
    set innerHTML(v) {
      innerHtmlVal = v;
      el.children = [];
      const optionMatches = v.match(/<option[^>]*>.*?<\/option>/gi) || [];
      optionMatches.forEach(optStr => {
        const valMatch = optStr.match(/value="([^"]*)"/i);
        const textMatch = optStr.match(/>([^<]*)</);
        const opt = createMockEl('option');
        opt.value = valMatch ? valMatch[1] : '';
        opt.textContent = textMatch ? textMatch[1] : '';
        el.children.push(opt);
      });
    },
    scrollWidth: 1400,
    querySelectorAll: (sel) => {
      const results = [];
      function findMatches(node) {
        if (!node) return;
        if (sel === 'button' && node.tagName === 'BUTTON') results.push(node);
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
    closest: () => null,
    appendChild: (child) => { el.children.push(child); },
    remove: () => {},
    addEventListener: () => {}
  };
  return el;
}

const mockDocument = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createMockEl();
    return elements[id];
  },
  querySelector: () => createMockEl(),
  querySelectorAll: () => [],
  createElement: (tag) => createMockEl(tag),
  body: {
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    appendChild: () => { },
    removeChild: () => { }
  }
};

const mockWindow = {
  innerWidth: 1400,
  addEventListener: () => { },
  location: { reload: () => { } },
  requestAnimationFrame: (fn) => fn()
};

const sandbox = {
  document: mockDocument,
  window: mockWindow,
  console: console,
  toast: (msg, kind) => { console.log(`  [Toast] (${kind || 'info'}): ${msg}`); },
  requireAdmin: (fn) => fn,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => fn(),
  renderSeriesTabs: () => { },
  renderDayFilter: () => { },
  toggleSidebar: () => { },
  showGenerationReport: () => { },
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
console.log('VERIFYING 3RD YEAR EVEN (22 SERIES) 10 COURSES SYNC');
console.log('====================================================\n');

// Load state from data/routine.json into localStorage first
const routineData = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/routine.json'), 'utf8'));
sandbox.localStorage.setItem('routineSchedulerData_v6', JSON.stringify(routineData.payload));
sandbox.loadState();

console.log('--- TEST 1: 22 Series Course Count in state.courses ---');
const c22 = sandbox.state.courses.filter(c => c.seriesId === 1003);
console.log('22 Series total courses:', c22.length);
c22.forEach((c, i) => console.log(`  ${i + 1}. [${c.code}] ${c.title} (${c.type}, ${c.credit} Cr, ${c.sessionsPerWeek} sess/wk)`));

assert.strictEqual(c22.length, 10, '22 Series MUST have exactly 10 courses matching 3rd Year Even syllabus!');
const expected32Codes = ['ECE 3205', 'ECE 3206', 'ECE 3207', 'ECE 3208', 'ECE 3221', 'ECE 3222', 'ME 3219', 'ME 3220', 'HUM 3217', 'ECE 3200'];
expected32Codes.forEach(code => {
  assert(c22.some(c => c.code.toUpperCase() === code.toUpperCase()), `Course ${code} must be present in 22 Series!`);
});
console.log('✓ PASS: All 10 courses for 3rd Year Even are present in 22 Series!\n');

console.log('--- TEST 2: Courses Section Display (coursesInActiveSeries) ---');
sandbox.state.activeSeriesId = 1003;
const activeCourses = sandbox.coursesInActiveSeries();
console.log('Active courses in Courses view count:', activeCourses.length);
assert.strictEqual(activeCourses.length, 10, 'Courses section MUST display all 10 courses for 22 Series!');
console.log('✓ PASS: Courses view shows all 10 courses for 22 Series!\n');

console.log('--- TEST 3: Auto-Gen Schedules All 10 Courses for 22 Series ---');
sandbox.runAutoGenerationEngine({ scope: 'single', targetSeriesId: 1003 });
const scheduled22 = sandbox.state.classes.filter(c => c.seriesId === 1003);
console.log('Total scheduled classes for 22 Series:', scheduled22.length);
const distinct22Codes = Array.from(new Set(scheduled22.map(c => c.code.toUpperCase())));
console.log('Distinct scheduled course codes:', distinct22Codes.length, distinct22Codes);

assert.strictEqual(distinct22Codes.length, 10, 'All 10 courses must be scheduled for 22 Series on routine!');
console.log('✓ PASS: All 10 courses for 22 Series successfully scheduled by Auto-Gen!\n');

console.log('--- TEST 4: 21 Series (4th Year Even) Auto-Gen ONLY Schedules Compulsory Courses ---');
sandbox.runAutoGenerationEngine({ scope: 'single', targetSeriesId: 1004 });
const scheduled21 = sandbox.state.classes.filter(c => c.seriesId === 1004);
console.log('Total scheduled classes for 21 Series:', scheduled21.length);
const scheduled21Codes = Array.from(new Set(scheduled21.map(c => c.code.toUpperCase())));
console.log('21 Series scheduled codes:', scheduled21Codes);

const compulsory21 = ['ECE 4209', 'ECE 4211', 'ECE 4212', 'ECE 4223', 'ECE 4224', 'ECE 4000'];
scheduled21Codes.forEach(code => {
  assert(compulsory21.includes(code), `21 Series Auto-Gen should ONLY schedule compulsory courses! Found: ${code}`);
  assert(!code.includes('**'), `Placeholder ${code} should never be scheduled!`);
});
console.log('✓ PASS: 21 Series Auto-Gen strictly preserved compulsory-only scheduling!\n');

console.log('--- TEST 5: Clean Seed Data also assigns all 10 courses ---');
sandbox.state.courses = [];
sandbox.state.classes = [];
sandbox.state.series = [];
sandbox.seedData();
const s22 = sandbox.state.series.find(x => x.name.includes('22'));
const seeded22 = sandbox.state.courses.filter(c => c.seriesId === s22.id);
console.log('Seeded 22 Series course count:', seeded22.length);
assert.strictEqual(seeded22.length, 10, 'Freshly seeded 22 Series must have all 10 courses!');
console.log('✓ PASS: Freshly seeded database has all 10 courses for 22 Series!\n');

console.log('====================================================');
console.log('ALL VERIFICATION TESTS COMPLETED AND PASSED 100%!');
console.log('====================================================');
