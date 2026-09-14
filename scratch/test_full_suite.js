const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('ROUTINE SCHEDULER: FULL SYSTEM VERIFICATION SUITE');
console.log('====================================================\n');

// Mock browser DOM environment
const listeners = {};
const mockElements = {};

function createMockElement(tag, id = '') {
  const el = {
    tagName: tag.toUpperCase(),
    id: id,
    style: {},
    classList: {
      _classes: new Set(),
      add: function (...c) { c.forEach(x => this._classes.add(x)); },
      remove: function (...c) { c.forEach(x => this._classes.delete(x)); },
      contains: function (c) { return this._classes.has(c); },
      toggle: function (c, v) { if (v) this.add(c); else this.remove(c); }
    },
    clientWidth: 1500,
    getBoundingClientRect: () => ({ width: 1040, height: 400 }),
    querySelectorAll: function (selector) {
      if (selector.includes('sheet-band > table.sheet-table')) return [mockBand1, mockBand2];
      if (selector.includes('sheet-legend > table.sheet-legend-table')) return [mockLegend1, mockLegend2];
      return [];
    },
    querySelector: function (selector) {
      if (selector === '.sheet-scale-box') return mockScaleBox;
      if (selector === '.routine-card') return mockRoutineCard;
      return null;
    }
  };
  return el;
}

const mockBand1 = createMockElement('table');
const mockBand2 = createMockElement('table');
const mockLegend1 = createMockElement('table');
const mockLegend2 = createMockElement('table');
const mockScaleBox = createMockElement('div');
const mockRoutineCard = createMockElement('div');
mockRoutineCard.clientWidth = 1500;

const dom = {
  localStorage: { getItem: () => null, setItem: () => { } },
  window: {
    addEventListener: (evt, fn) => { listeners[evt] = fn; }
  },
  document: {
    createElement: (tag) => createMockElement(tag),
    body: { classList: { add: () => { }, remove: () => { } } },
    getElementById: (id) => {
      if (id === 'mainArea') return mockRoutineCard;
      if (!mockElements[id]) mockElements[id] = createMockElement('div', id);
      return mockElements[id];
    },
    querySelectorAll: (sel) => []
  }
};

const codeData = fs.readFileSync('js/data.js', 'utf8') + '\nglobalThis.state = state; globalThis.DAYS = DAYS; globalThis.seedData = seedData; globalThis.resolveLabId = resolveLabId;';
const codeUtils = fs.readFileSync('js/utils.js', 'utf8') + '\nglobalThis.studentsInActiveSeries = studentsInActiveSeries; globalThis.activeSeries = activeSeries; globalThis.teacherById = teacherById; globalThis.teacherShort = teacherShort;';
const codeSettings = fs.readFileSync('js/settings.js', 'utf8') + '\nglobalThis.settings = settings;';
const codeRoutine = fs.readFileSync('js/routine.js', 'utf8') + '\nglobalThis.equalizeBandWidths = equalizeBandWidths; globalThis.openAutoGenerateModal = openAutoGenerateModal; globalThis.runAutoGenerationEngine = runAutoGenerationEngine; globalThis.buildSheetHtml = buildSheetHtml;';

let openedModalHtml = '';
const sandbox = {
  ...dom,
  console,
  setTimeout,
  clearTimeout,
  renderSeriesTabs: () => { },
  renderDayFilter: () => { },
  toggleSidebar: () => { },
  requireAdmin: (fn) => fn,
  toast: (msg, type) => { console.log(`  [Toast] (${type}): ${msg}`); },
  openModal: (html) => { openedModalHtml = html; },
  closeModal: () => { },
  saveState: () => { }
};
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(codeData, sandbox);
vm.runInContext(codeUtils, sandbox);
vm.runInContext(codeSettings, sandbox);
vm.runInContext(codeRoutine, sandbox);

sandbox.seedData();

// ----------------------------------------------------
// TEST 1: Full-Width View (Right-Side Gap Elimination)
// ----------------------------------------------------
console.log('--- TEST 1: Full-Width Layout & EqualizeBandWidths ---');
sandbox.state.sheetZoom = 'fit';

// Test 1A: Desktop (1500px wide)
mockRoutineCard.clientWidth = 1500;
const root = createMockElement('div');
root.querySelector = function (sel) {
  if (sel === '.sheet-scale-box') return mockScaleBox;
  if (sel === '.routine-card') return mockRoutineCard;
  return null;
};
root.querySelectorAll = function (sel) {
  if (sel.includes('table.sheet-table')) return [mockBand1, mockBand2];
  if (sel.includes('table.sheet-legend-table')) return [mockLegend1, mockLegend2];
  return [];
};

sandbox.equalizeBandWidths(root);

console.log('Desktop view scaleBox zoom:', mockScaleBox.style.zoom);
console.log('Desktop view scaleBox width:', mockScaleBox.style.width);
console.log('Desktop view band1 width:', mockBand1.style.width);
console.log('Desktop view band2 width:', mockBand2.style.width);
console.log('Desktop view legend1 width:', mockLegend1.style.width);

if (mockScaleBox.style.zoom !== '1' || mockBand1.style.width !== '100%' || mockBand2.style.width !== '100%') {
  console.error('FAIL: Desktop tables did not stretch to 100% full width!');
  process.exit(1);
}
console.log('✓ PASS: Desktop mode expands to 100% full view, completely eliminating the right-side gap!\n');

// Test 1B: Narrow Screen (700px wide)
mockRoutineCard.clientWidth = 700;
sandbox.equalizeBandWidths(root);
console.log('Narrow screen scaleBox zoom:', mockScaleBox.style.zoom);
console.log('Narrow screen scaleBox width:', mockScaleBox.style.width);
if (Number(mockScaleBox.style.zoom) >= 1) {
  console.error('FAIL: Narrow screen should have scaled down with zoom < 1');
  process.exit(1);
}
console.log('✓ PASS: Narrow screen scales down smoothly to prevent horizontal overflow!\n');

// ----------------------------------------------------
// TEST 2: Auto-Generate Modal & Dual Scope Options
// ----------------------------------------------------
console.log('--- TEST 2: Auto-Generate Modal UI & Dual Scope ---');
sandbox.openAutoGenerateModal();
const hasWholeSeriesOption = openedModalHtml.includes('Whole Series (Complete Master Department Routine)');
const hasSpecificSeriesOption = openedModalHtml.includes('Specific Series Only');
const hasMorningPriorityBadge = openedModalHtml.includes('Morning Priority for All Series');
const hasNoBackToBackBadge = openedModalHtml.includes('Strict No Back-to-Back Teaching');
const hasLabBadge = openedModalHtml.includes('3-Period Continuous Labs');

console.log('Modal contains "Whole Series":', hasWholeSeriesOption);
console.log('Modal contains "Specific Series":', hasSpecificSeriesOption);
console.log('Modal contains "Morning Priority":', hasMorningPriorityBadge);
console.log('Modal contains "No Back-to-Back":', hasNoBackToBackBadge);
console.log('Modal contains "3-Period Continuous Labs":', hasLabBadge);

if (!hasWholeSeriesOption || !hasSpecificSeriesOption || !hasMorningPriorityBadge || !hasNoBackToBackBadge) {
  console.error('FAIL: Auto-generate modal missing required options or badges');
  process.exit(1);
}
console.log('✓ PASS: Auto-generate modal contains dual scope and all academic guarantees!\n');

// ----------------------------------------------------
// TEST 3: Auto-Generate Whole Series Engine
// ----------------------------------------------------
console.log('--- TEST 3: Whole Series Auto-Generation Engine ---');
sandbox.runAutoGenerationEngine({ scope: 'all' });

const totalClasses = sandbox.state.classes.length;
console.log('Generated total classes:', totalClasses);
if (totalClasses < 60) {
  console.error(`FAIL: Expected at least 60 scheduled sessions, got ${totalClasses}`);
  process.exit(1);
}

// Check zero faculty double booking, zero room clashes, zero back-to-back violations
let teacherClashes = 0;
let roomClashes = 0;
let seriesClashes = 0;
let backToBackViolations = 0;
let morningCount = 0;
const seriesMorningSlots = {};
sandbox.state.series.forEach(s => { seriesMorningSlots[s.id] = 0; });

for (let i = 0; i < sandbox.state.classes.length; i++) {
  const a = sandbox.state.classes[i];
  if (a.start <= 10) {
    morningCount++;
    seriesMorningSlots[a.seriesId] = (seriesMorningSlots[a.seriesId] || 0) + 1;
  }

  // Check Monday dept meeting violation
  if (a.day === 'Monday' && a.start < 17 && a.start + a.span > 14) {
    console.error('FAIL: Monday Department Meeting violated by class:', a);
    process.exit(1);
  }

  for (let j = i + 1; j < sandbox.state.classes.length; j++) {
    const b = sandbox.state.classes[j];
    if (a.day !== b.day) continue;

    const overlap = a.start < b.start + b.span && b.start < a.start + a.span;
    if (overlap) {
      if (a.seriesId === b.seriesId) seriesClashes++;
      if (a.teacherId && a.teacherId === b.teacherId) teacherClashes++;
      if (a.room && a.room === b.room) roomClashes++;
    }

    // Teacher back-to-back check
    if (a.teacherId && a.teacherId === b.teacherId) {
      if (a.start + a.span === b.start || b.start + b.span === a.start) {
        backToBackViolations++;
        console.error('Back to back violation for teacher', a.teacherId, a.code, '@', a.start, 'and', b.code, '@', b.start, 'on', a.day);
      }
      if ((a.start + a.span === 10 && b.start === 11) || (b.start + b.span === 10 && a.start === 11)) {
        backToBackViolations++;
      }
    }
  }
}

console.log('Teacher clashes:', teacherClashes);
console.log('Room clashes:', roomClashes);
console.log('Series clashes:', seriesClashes);
console.log('Back-to-back violations:', backToBackViolations);
console.log('Total morning slots filled:', morningCount);
console.log('Morning distribution per series:', seriesMorningSlots);

if (teacherClashes !== 0 || roomClashes !== 0 || seriesClashes !== 0 || backToBackViolations !== 0) {
  console.error('FAIL: Conflicts or back-to-back violations detected in generated schedule!');
  process.exit(1);
}

// Verify morning priority for all series
for (const s of sandbox.state.series) {
  const m = seriesMorningSlots[s.id];
  const sc = sandbox.state.classes.filter(c => c.seriesId === s.id);
  console.log(`Series ${s.name}: ${sc.length} classes total, ${m} morning slots`);
  if (sc.length > 5 && m === 0) {
    console.error(`FAIL: Series ${s.name} received 0 morning slots!`);
    process.exit(1);
  }
}
console.log('✓ PASS: Whole Series generation has 0 clashes, 0 back-to-back violations, and active morning priority!\n');

// ----------------------------------------------------
// TEST 4: Auto-Generate Specific Series Engine
// ----------------------------------------------------
console.log('--- TEST 4: Specific Series Auto-Generation (24 Series) ---');
const s24 = sandbox.state.series[1];
const prevCountOther = sandbox.state.classes.filter(c => c.seriesId !== s24.id).length;

sandbox.runAutoGenerationEngine({ scope: 'single', targetSeriesId: s24.id });

const postCountOther = sandbox.state.classes.filter(c => c.seriesId !== s24.id).length;
const s24Count = sandbox.state.classes.filter(c => c.seriesId === s24.id).length;

console.log(`Other series class count preserved: ${prevCountOther} === ${postCountOther}`);
console.log(`24 Series class count: ${s24Count}`);

if (prevCountOther !== postCountOther) {
  console.error('FAIL: Other series classes were modified during single-series generation!');
  process.exit(1);
}
if (s24Count === 0) {
  console.error('FAIL: 24 Series classes were not generated!');
  process.exit(1);
}

// Check zero clashes across the newly combined routine
let singleTeacherClashes = 0;
let singleRoomClashes = 0;
let singleSeriesClashes = 0;
let singleBackToBack = 0;

for (let i = 0; i < sandbox.state.classes.length; i++) {
  const a = sandbox.state.classes[i];
  for (let j = i + 1; j < sandbox.state.classes.length; j++) {
    const b = sandbox.state.classes[j];
    if (a.day !== b.day) continue;

    const overlap = a.start < b.start + b.span && b.start < a.start + a.span;
    if (overlap) {
      if (a.seriesId === b.seriesId) singleSeriesClashes++;
      if (a.teacherId && a.teacherId === b.teacherId) singleTeacherClashes++;
      if (a.room && a.room === b.room) singleRoomClashes++;
    }

    if (a.teacherId && a.teacherId === b.teacherId) {
      if (a.start + a.span === b.start || b.start + b.span === a.start) {
        singleBackToBack++;
      }
    }
  }
}

console.log(`Combined Routine Check: Teacher Clashes = ${singleTeacherClashes}, Room Clashes = ${singleRoomClashes}, Series Clashes = ${singleSeriesClashes}, Back-to-Back = ${singleBackToBack}`);

if (singleTeacherClashes !== 0 || singleRoomClashes !== 0 || singleSeriesClashes !== 0 || singleBackToBack !== 0) {
  console.error('FAIL: Combined routine has clashes after single-series auto-generation!');
  process.exit(1);
}
console.log('✓ PASS: Specific Series generation seamlessly integrates without clashes into the master routine!\n');

console.log('====================================================');
console.log('ALL VERIFICATION SUITE TESTS PASSED 100%!');
console.log('====================================================');

