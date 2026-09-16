const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

// Load files
const logoCode = fs.readFileSync(path.join(__dirname, '../js/logo.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const settingsCode = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8');
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
const modalCode = fs.readFileSync(path.join(__dirname, '../js/modal.js'), 'utf8');
const crudCode = fs.readFileSync(path.join(__dirname, '../js/crud.js'), 'utf8');
const routineCode = fs.readFileSync(path.join(__dirname, '../js/routine.js'), 'utf8');
const coursesCode = fs.readFileSync(path.join(__dirname, '../js/courses.js'), 'utf8');

// Lightweight DOM mock
const domStore = {};
function createMockElement(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    value: '',
    innerHTML: '',
    style: {},
    dataset: {},
    classList: {
      add: () => { },
      remove: () => { },
      contains: () => false
    },
    addEventListener: () => { },
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    closest: () => null,
    insertBefore: () => { }
  };
  return el;
}

const elements = {};
const documentMock = {
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body'),
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = createMockElement();
      elements[id].id = id;
    }
    return elements[id];
  },
  querySelectorAll: (sel) => []
};

let lastModalHtml = '';
const ctx = {
  localStorage: { getItem: () => null, setItem: () => { } },
  sessionStorage: { getItem: () => 'active', setItem: () => { } },
  window: { addEventListener: () => { } },
  document: documentMock,
  console,
  setTimeout,
  clearTimeout,
  toast: (msg, type) => console.log(`[Toast] (${type}): ${msg}`),
  openModal: (html) => {
    lastModalHtml = html;
    // parse HTML snippet to populate simple elements
    const cfTypeMatch = html.match(/id="cf-type"/);
    const codeMatch = html.match(/id="cf-code"\s+value="([^"]*)"/);
    if (codeMatch) elements['cf-code'] = { value: codeMatch[1] };
    else elements['cf-code'] = { value: '' };
    if (cfTypeMatch) elements['cf-type'] = { value: 'theory' };
    elements['cf-title'] = { value: '' };
    elements['cf-dept'] = { value: 'ECE' };
    elements['cf-credit'] = { value: '3' };
    elements['cf-sessions'] = { value: '3' };
    elements['cf-students'] = { value: '60' };
    elements['teacherSection'] = { innerHTML: '' };
    elements['cSave'] = { onclick: null };
  },
  closeModal: () => { },
  crudPage: () => { },
  renderSeriesTabs: () => { },
  requireAdmin: (fn) => fn
};

ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext([logoCode, dataCode, settingsCode, utilsCode, crudCode, routineCode, coursesCode].join('\n'), ctx);
ctx.state = vm.runInContext('state', ctx);
ctx.seedData = vm.runInContext('seedData', ctx);
ctx.openCourseModal = vm.runInContext('openCourseModal', ctx);

ctx.seedData();

console.log('--- TEST: Course Modal Room Selection ---');

// Test 1: openCourseModal for adding a new course
ctx.openCourseModal(null);

// The modal should contain the teacherSection with Room select
const teacherSec = elements['teacherSection'].innerHTML;
assert(teacherSec.includes('Assign Classroom / Room'), 'Should include label for room assignment');
assert(teacherSec.includes('id="cf-room"'), 'Should include select with id="cf-room"');
assert(teacherSec.includes('— Select Room —'), 'Should include placeholder option');
console.log('✓ PASS: Course modal renders room select dropdown.');

// Check that rooms are listed in cf-room
for (const r of ctx.state.rooms) {
  assert(teacherSec.includes(r.code), `Should list room ${r.code}`);
}
console.log('✓ PASS: All available departmental rooms are present in dropdown.');

// Test 2: Fill course info, select teacher & room, save
const targetRoom = ctx.state.rooms[1]; // R-402
const targetTeacher = ctx.state.teachers[0]; // SMAR

elements['cf-code'].value = 'ECE 9999';
elements['cf-title'].value = 'Advanced Robotics';
elements['cf-teacher'] = { value: String(targetTeacher.id) };
elements['cf-room'] = { value: String(targetRoom.id) };

// Trigger save
elements['cSave'].onclick();

// Verify new course in state.courses
const createdCourse = ctx.state.courses.find(c => c.code === 'ECE 9999');
assert(createdCourse, 'Course ECE 9999 should exist in state.courses');
assert.strictEqual(createdCourse.teacherId, targetTeacher.id, 'Teacher ID should match');
assert.strictEqual(createdCourse.roomId, targetRoom.id, 'Room ID should match');
assert.strictEqual(createdCourse.room, targetRoom.code, 'Room code string should match');
console.log('✓ PASS: Course saved successfully with roomId and room code.');

// Test 3: Edit existing course - verify preselection
ctx.openCourseModal(createdCourse);
const editSec = elements['teacherSection'].innerHTML;
assert(editSec.includes(`value="${targetRoom.id}" selected`), 'Room should be pre-selected in edit modal');
assert(editSec.includes(`value="${targetTeacher.id}" selected`), 'Teacher should be pre-selected in edit modal');
console.log('✓ PASS: Edit modal correctly pre-selects assigned teacher and room.');

// Test 4: Update room in edit modal
const newRoom = ctx.state.rooms[2]; // R-403
elements['cf-room'].value = String(newRoom.id);
elements['cSave'].onclick();

assert.strictEqual(createdCourse.roomId, newRoom.id, 'Room ID should update to R-403');
assert.strictEqual(createdCourse.room, newRoom.code, 'Room code should update to R-403');
console.log('✓ PASS: Editing and updating room works correctly.');

console.log('\nALL COURSE ROOM SELECTION TESTS PASSED 100%!');
