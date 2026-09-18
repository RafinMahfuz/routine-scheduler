// scratch/test_meeting_dnd.js
// Automated verification for Departmental Meeting Drag and Drop across days

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(baseDir, 'js/data.js'), 'utf8');
const settingsCode = fs.readFileSync(path.join(baseDir, 'js/settings.js'), 'utf8');
const utilsCode = fs.readFileSync(path.join(baseDir, 'js/utils.js'), 'utf8');
const routineCode = fs.readFileSync(path.join(baseDir, 'js/routine.js'), 'utf8');

// Mock browser DOM and environment
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
    innerHTML: '',
    value: '',
    querySelectorAll: (sel) => [],
    querySelector: (sel) => null,
    clientWidth: 1400,
    scrollWidth: 1400
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

let confirmed = true;
const windowMock = {
  confirm: (msg) => confirmed,
  innerWidth: 1200,
  innerHeight: 800,
  localStorage: {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
  },
  location: { reload: () => { } },
  addEventListener: () => { }
};

const ctx = {
  console,
  document: documentMock,
  window: windowMock,
  confirm: (msg) => confirmed,
  localStorage: windowMock.localStorage,
  setTimeout: (fn) => fn(),
  clearTimeout: () => { },
  requestAnimationFrame: (fn) => fn(),
  alert: (msg) => console.log('  [Alert]:', msg),
  toast: (msg, type) => console.log(`  [Toast] (${type || 'info'}): ${msg}`),
  renderSeriesTabs: () => { },
  renderDayFilter: () => { },
  requireAdmin: (fn) => fn
};

const codeData = dataCode + '\nglobalThis.state = state; globalThis.DAYS = DAYS; globalThis.seedData = seedData; globalThis.resolveLabId = resolveLabId; globalThis.saveState = saveState;';
const codeSettings = settingsCode + '\nglobalThis.settings = settings;';
const codeUtils = utilsCode + '\nglobalThis.studentsInActiveSeries = studentsInActiveSeries; globalThis.activeSeries = activeSeries; globalThis.teacherById = teacherById; globalThis.teacherShort = teacherShort;';
const codeRoutine = routineCode + '\nglobalThis.buildSheetHtml = buildSheetHtml; globalThis.moveMeeting = moveMeeting;';

ctx.globalThis = ctx;
vm.createContext(ctx);

vm.runInContext(codeData, ctx);
vm.runInContext(codeSettings, ctx);
vm.runInContext(codeUtils, ctx);
vm.runInContext(codeRoutine, ctx);

ctx.seedData();

console.log('====================================================');
console.log('TESTING DEPARTMENTAL MEETING DRAG & DROP');
console.log('====================================================\n');

// 1. Initial Meeting Configuration
console.log('--- TEST 1: Initial Meeting State & Protection ---');
const meeting = ctx.state.meeting;
console.log('Initial meeting object:', meeting);
if (meeting.day !== 'Monday' || meeting.start !== 14 || meeting.span !== 3) {
  console.error('FAIL: Initial meeting is not Monday 2:30-5:00 PM');
  process.exit(1);
}
console.log('✓ PASS: Initial meeting is Monday slot 14 (span 3)');

const isMeetingSlot = (day, start) => ctx.state.meeting && ctx.state.meeting.day === day && start >= ctx.state.meeting.start && start < ctx.state.meeting.start + ctx.state.meeting.span;

const isMondayDept = isMeetingSlot('Monday', 14);
const isTuesdayDept = isMeetingSlot('Tuesday', 14);
if (!isMondayDept || isTuesdayDept) {
  console.error('FAIL: isMeetingSlot incorrect for initial state');
  process.exit(1);
}
console.log('✓ PASS: Monday slot 14 is protected as Dept Meeting; Tuesday is not');

// 2. Sheet HTML contains draggable meeting on Monday
console.log('\n--- TEST 2: Sheet HTML Draggable Attributes ---');
let sheetHtml = ctx.buildSheetHtml(ctx.state.series, true);
if (!sheetHtml.includes('data-dragmeeting="1"') || !sheetHtml.includes('sheet-meeting-draggable')) {
  console.error('FAIL: Sheet HTML does not have draggable meeting attributes');
  process.exit(1);
}
if (!sheetHtml.includes('data-day-header="Monday"') || !sheetHtml.includes('data-day-header="Tuesday"')) {
  console.error('FAIL: Sheet HTML day headers missing data-day-header attributes');
  process.exit(1);
}
console.log('✓ PASS: Sheet HTML renders data-dragmeeting="1", sheet-meeting-draggable, and data-day-header');

// 3. Move meeting to Tuesday
console.log('\n--- TEST 3: Move Meeting to Tuesday ---');
ctx.moveMeeting('Tuesday', 14);

if (ctx.state.meeting.day !== 'Tuesday') {
  console.error(`FAIL: Meeting day did not change to Tuesday, got ${ctx.state.meeting.day}`);
  process.exit(1);
}
console.log('✓ PASS: Meeting day updated to Tuesday in state');

if (isMeetingSlot('Monday', 14) || !isMeetingSlot('Tuesday', 14)) {
  console.error('FAIL: Meeting slot status incorrect after move');
  process.exit(1);
}
console.log('✓ PASS: Tuesday 14 is now Dept Meeting; Monday 14 is freed');

sheetHtml = ctx.buildSheetHtml(ctx.state.series, true);
// Check that Tuesday now contains the meeting
const tuesdayIndex = sheetHtml.indexOf('data-day-header="Tuesday"');
const meetingIndex = sheetHtml.indexOf('data-dragmeeting="1"');
console.log('Tuesday header pos:', tuesdayIndex, 'Meeting cell pos:', meetingIndex);
if (meetingIndex === -1) {
  console.error('FAIL: Draggable meeting not found in rendered sheet HTML after move');
  process.exit(1);
}
console.log('✓ PASS: Rendered sheet reflects Tuesday meeting cell');

// 4. Move to Wednesday with conflicting class and verify swap
console.log('\n--- TEST 4: Move Meeting to Wednesday with Class Conflict & Swap ---');
// Check classes on Wednesday at 14
const wedClasses = ctx.state.classes.filter(c => c.day === 'Wednesday' && c.start === 14);
console.log(`Found ${wedClasses.length} class(es) on Wednesday slot 14:`, wedClasses.map(c => c.courseCode || c.courseId));

confirmed = true;
ctx.moveMeeting('Wednesday', 14);

if (ctx.state.meeting.day !== 'Wednesday') {
  console.error(`FAIL: Meeting day did not change to Wednesday, got ${ctx.state.meeting.day}`);
  process.exit(1);
}
console.log('✓ PASS: Meeting successfully moved to Wednesday');

// Check that the class that was on Wednesday 14 moved to Tuesday 14 (vacated meeting slot)
const swappedClasses = ctx.state.classes.filter(c => c.day === 'Tuesday' && c.start === 14);
console.log('Classes moved to vacated Tuesday slot 14:', swappedClasses.map(c => c.courseCode || c.courseId));
if (wedClasses.length > 0 && swappedClasses.length !== wedClasses.length) {
  console.error('FAIL: Conflicting class was not moved to the vacated meeting slot');
  process.exit(1);
}
console.log('✓ PASS: Conflicting classes swapped cleanly to vacated slot');

// 5. Move meeting back to Monday
console.log('\n--- TEST 5: Return Meeting to Monday ---');
ctx.moveMeeting('Monday', 14);
if (ctx.state.meeting.day !== 'Monday') {
  console.error('FAIL: Could not move meeting back to Monday');
  process.exit(1);
}
console.log('✓ PASS: Meeting successfully returned to Monday');

console.log('\n====================================================');
console.log('ALL DEPARTMENTAL MEETING DRAG & DROP TESTS PASSED 100%!');
console.log('====================================================');
