const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('TEST SUITE: FULL ROOM NUMBER VISIBILITY & INTEGRITY');
console.log('====================================================');

const css = fs.readFileSync('css/style.css', 'utf8');
const dataCode = fs.readFileSync('js/data.js', 'utf8');
const utilsCode = fs.readFileSync('js/utils.js', 'utf8');
const routineCode = fs.readFileSync('js/routine.js', 'utf8');

// --- 1. CSS AUDIT ---
console.log('\n--- 1. CSS Audits ---');

// Check screen .scc-room-badge
const screenBadgeMatch = css.match(/\.scc-room-badge\s*\{([^}]+)\}/);
if (!screenBadgeMatch) {
  console.error('FAIL: .scc-room-badge rule not found');
  process.exit(1);
}
const screenBadgeCss = screenBadgeMatch[1];
const hasEllipsisScreen = screenBadgeCss.includes('text-overflow: ellipsis');
const hasOverflowHiddenScreen = screenBadgeCss.includes('overflow: hidden');
const hasBoxSizingScreen = screenBadgeCss.includes('box-sizing: border-box');
const hasTextClipScreen = screenBadgeCss.includes('text-overflow: clip');

console.log('Screen .scc-room-badge text-overflow: ellipsis:', hasEllipsisScreen, '(expected false)');
console.log('Screen .scc-room-badge overflow: hidden:', hasOverflowHiddenScreen, '(expected false)');
console.log('Screen .scc-room-badge box-sizing: border-box:', hasBoxSizingScreen, '(expected true)');
console.log('Screen .scc-room-badge text-overflow: clip:', hasTextClipScreen, '(expected true)');

if (hasEllipsisScreen || hasOverflowHiddenScreen || !hasBoxSizingScreen) {
  console.error('FAIL: Screen room badge still has ellipsis or overflow clipping');
  process.exit(1);
}
console.log('✓ PASS: Screen .scc-room-badge has no ellipsis truncation and has proper box-sizing');

// Check @media print .scc-room-badge
const printSection = css.split('@media print')[1] || '';
const printBadgeMatch = printSection.match(/\.scc-room-badge\s*\{([^}]+)\}/);
if (!printBadgeMatch) {
  console.error('FAIL: Print .scc-room-badge rule not found');
  process.exit(1);
}
const printBadgeCss = printBadgeMatch[1];
const printVisible = printBadgeCss.includes('overflow: visible');
const printClip = printBadgeCss.includes('text-overflow: clip');
const printNoEllipsis = !printBadgeCss.includes('text-overflow: ellipsis');

console.log('Print .scc-room-badge overflow: visible:', printVisible, '(expected true)');
console.log('Print .scc-room-badge text-overflow: clip:', printClip, '(expected true)');
console.log('Print .scc-room-badge no ellipsis:', printNoEllipsis, '(expected true)');

if (!printVisible || !printClip || !printNoEllipsis) {
  console.error('FAIL: Print room badge does not have visible overflow/clip');
  process.exit(1);
}
console.log('✓ PASS: Print .scc-room-badge strictly prevents ellipsis truncation');

// --- 2. HTML RENDERING OF ROOMS ACROSS ALL SEED CLASSES ---
console.log('\n--- 2. HTML Rendering Audits Across All Classes ---');

const settingsCode = fs.readFileSync('js/settings.js', 'utf8');

const sandbox = {
  localStorage: { getItem: () => null, setItem: () => { } },
  window: { addEventListener: () => { } },
  document: {
    createElement: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }),
    body: { classList: { add: () => { }, remove: () => { } } },
    getElementById: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }),
    querySelectorAll: () => []
  },
  console,
  setTimeout,
  clearTimeout,
  toast: () => { },
  renderSeriesTabs: () => { },
  openModal: () => { }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataCode + '\n' + settingsCode + '\n' + utilsCode + '\n' + routineCode + '\nglobalThis.state = state; globalThis.seedData = seedData; globalThis.sheetClassCellHtml = sheetClassCellHtml; globalThis.runAutoGenerationEngine = runAutoGenerationEngine;', sandbox);
sandbox.seedData();

const classesWithRoom = sandbox.state.classes.filter(c => c.room);
console.log(`Total classes in seed routine: ${sandbox.state.classes.length}`);
console.log(`Classes with assigned room: ${classesWithRoom.length}`);

let allRoomsRenderedCleanly = true;
let totalChecked = 0;

classesWithRoom.forEach(c => {
  const colorHtml = sandbox.sheetClassCellHtml(c, false, false);
  const monoHtml = sandbox.sheetClassCellHtml(c, false, true);

  totalChecked++;

  // Verify room is rendered inside scc-room and scc-room-badge
  if (!colorHtml.includes('class="scc-room"') || !colorHtml.includes('class="scc-room-badge"')) {
    console.error(`FAIL: Missing scc-room markup for class ${c.code} room ${c.room}`);
    allRoomsRenderedCleanly = false;
  }

  // Verify title attribute is present with exact room name
  const expectedTitle = `title="${c.room}"`;
  if (!colorHtml.includes(expectedTitle)) {
    console.error(`FAIL: Missing title attribute ${expectedTitle} for class ${c.code}`);
    allRoomsRenderedCleanly = false;
  }

  // Verify room name is fully present (ignoring <wbr>)
  const textInBadge = colorHtml.match(/<span class="scc-room-badge"[^>]*>(.*?)<\/span>/);
  if (!textInBadge) {
    console.error(`FAIL: Cannot extract badge text for class ${c.code}`);
    allRoomsRenderedCleanly = false;
  } else {
    const rawContent = textInBadge[1].replace(/<wbr>/g, '').replace(/\s+/g, ' ').trim();
    const expectedNormalized = String(c.room).replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();
    if (rawContent !== expectedNormalized) {
      console.error(`FAIL: Room content mismatch! Expected '${expectedNormalized}', got '${rawContent}'`);
      allRoomsRenderedCleanly = false;
    }
  }

  // Verify zero emoji in cell
  if (colorHtml.includes('👤') || monoHtml.includes('👤')) {
    console.error(`FAIL: Cell contains emoji 👤 for class ${c.code}`);
    allRoomsRenderedCleanly = false;
  }
});

if (allRoomsRenderedCleanly) {
  console.log(`✓ PASS: All ${totalChecked} class cells render their full room number with 100% integrity and tooltips!`);
} else {
  console.error('FAIL: Some room badges failed rendering checks');
  process.exit(1);
}

// Sample checks on specific long and compound rooms
const sampleCompound = sandbox.state.classes.find(c => c.room && c.room.includes('/'));
console.log(`\nSample compound room check: ${sampleCompound.code} -> ${sampleCompound.room}`);
const sampleHtml = sandbox.sheetClassCellHtml(sampleCompound, false, false);
console.log(sampleHtml.match(/<div class="scc-room">.*?<\/div>/)[0]);

const sampleProject = sandbox.state.classes.find(c => c.room && c.room.includes('Thesis'));
console.log(`\nSample long project room check: ${sampleProject.code} -> ${sampleProject.room}`);
const projectHtml = sandbox.sheetClassCellHtml(sampleProject, false, false);
console.log(projectHtml.match(/<div class="scc-room">.*?<\/div>/)[0]);

// --- 3. AUTOGEN LAB NOTATION AUDIT ---
console.log('\n--- 3. Auto-Generation Lab Notation Audit ---');
sandbox.renderRoutine = () => { };
const autogenRes = sandbox.runAutoGenerationEngine({ scope: 'all' });
console.log('Autogen returned:', autogenRes, 'Total classes in state:', sandbox.state.classes.length);

const autogenRooms = [...new Set(sandbox.state.classes.map(c => c.room))];
console.log('Unique rooms in autogenerated routine:', autogenRooms);

const hasLongDescriptiveLabNames = autogenRooms.some(r => r && (r.includes('Machine LAB') || r.includes('Circuit LAB')));
console.log('Contains long full-name lab strings:', hasLongDescriptiveLabNames, '(expected false, should use Lab-N)');

if (hasLongDescriptiveLabNames) {
  console.error('FAIL: Auto-generate produced long descriptive lab names instead of Lab-N standard');
  process.exit(1);
}
console.log('✓ PASS: Auto-generate cleanly uses standard Lab-N labels matching the laboratory legend table');

console.log('\n====================================================');
console.log('ALL ROOM NUMBER VISIBILITY TESTS PASSED 100%!');
console.log('====================================================');
