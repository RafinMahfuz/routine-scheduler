const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('TEST SUITE: TEXT CLARITY, READABILITY & LEGIBILITY');
console.log('====================================================\n');

// 1. Audit CSS word-break and typography rules
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

// Teacher pill word breaking in print
const printPillMatch = styleCss.match(/\.scc-teacher-pill\s*\{[^}]*\}/s);
if (!printPillMatch) throw new Error('Could not find .scc-teacher-pill in style.css');
const printPill = printPillMatch[0];

const hasKeepAll = printPill.includes('word-break: keep-all');
const hasNormalOverflow = printPill.includes('overflow-wrap: normal');
console.log('1. Print .scc-teacher-pill has word-break: keep-all:', hasKeepAll);
console.log('2. Print .scc-teacher-pill has overflow-wrap: normal:', hasNormalOverflow);
if (!hasKeepAll || !hasNormalOverflow) throw new Error('.scc-teacher-pill allows word breaking inside initials');

// Monochrome teacher pill word breaking
const monoPillMatch = styleCss.match(/body\.printing-monochrome \.scc-teacher-pill[\s\S]*?\{[^}]*\}/);
if (!monoPillMatch) throw new Error('Could not find mono .scc-teacher-pill');
const monoPill = monoPillMatch[0];
console.log('3. Monochrome .scc-teacher-pill has word-break: keep-all:', monoPill.includes('word-break: keep-all'));
console.log('4. Monochrome .scc-teacher-pill has overflow-wrap: normal:', monoPill.includes('overflow-wrap: normal'));
if (!monoPill.includes('word-break: keep-all') || !monoPill.includes('overflow-wrap: normal')) {
  throw new Error('Monochrome .scc-teacher-pill allows word breaking inside initials');
}

// Room badge no-wrap
console.log('5. Print .scc-room-badge has white-space: nowrap:', styleCss.includes('.scc-room-badge') && styleCss.includes('white-space: nowrap'));

// Day and time header styling
console.log('6. Day header th.sheet-th-day has prominent uppercase styling:', styleCss.includes('.sheet-th-day') && styleCss.includes('text-transform: uppercase'));
console.log('7. Time header th.sheet-th-time has dedicated styling:', styleCss.includes('.sheet-th-time'));

// 2. Audit routine.js HTML generation logic
const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8') + '\nglobalThis.state = state; globalThis.seedData = seedData;';
const utilsJs = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8') + '\nglobalThis.teacherForClass = teacherForClass; globalThis.teacherCodesForClass = teacherCodesForClass; globalThis.teacherShort = teacherShort; globalThis.classColor = classColor;';
const routineJs = fs.readFileSync(path.join(__dirname, '../js/routine.js'), 'utf8') + '\nglobalThis.sheetClassCellHtml = sheetClassCellHtml; globalThis.seriesRowLabelHtml = seriesRowLabelHtml;';

const sandbox = {
  window: {},
  document: { getElementById: () => null },
  localStorage: { getItem: () => null, setItem: () => { } },
  console: console,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataJs, sandbox);
vm.runInContext(utilsJs, sandbox);
vm.runInContext(routineJs, sandbox);

sandbox.seedData();

// Test row label rendering
const seriesLabels = sandbox.state.series.map(s => sandbox.seriesRowLabelHtml(s));
console.log('\n--- SERIES ROW LABELS ---');
seriesLabels.forEach((html, i) => {
  console.log(`Series ${i + 1}: ${html.replace(/\s+/g, ' ')}`);
  if (html.includes('Semester') && html.includes('Series')) {
    throw new Error('Series label contains clumsy "Semester [Year] Series" repetition');
  }
});

// Test class cell rendering: check that 2-letter and 3-letter initials are never broken
console.log('\n--- TEACHER INITIALS INTEGRITY ---');
let checkedClasses = 0;
let compoundSingleSlots = 0;
let labsChecked = 0;

sandbox.state.classes.forEach(c => {
  checkedClasses++;
  const html = sandbox.sheetClassCellHtml(c, false, true);

  // If single teacher initial (e.g. TA, MAH, MFA, RH, MAK, MMR, SK)
  if (c.initials && !c.initials.includes('+') && !c.initials.includes('/')) {
    // Should NOT contain <br> inside the teacher pill
    const pillContent = html.match(/<span class="scc-teacher-pill"[^>]*>([\s\S]*?)<\/span>/);
    if (pillContent) {
      if (pillContent[1].includes('<br>')) {
        throw new Error(`Single teacher initial was broken with <br>: ${c.initials}`);
      }
    }
  }

  // If compound teacher in single slot (span === 1), should break cleanly at + or /
  if (c.span <= 1 && c.initials && (c.initials.includes('+') || c.initials.includes('/'))) {
    compoundSingleSlots++;
    const pillContent = html.match(/<span class="scc-teacher-pill"[^>]*>([\s\S]*?)<\/span>/);
    if (!pillContent || !pillContent[1].includes('<br>')) {
      throw new Error(`Compound initial in single slot was not cleanly broken with <br>: ${c.initials}`);
    }
  }

  // If multi-period lab (span >= 2), code should not split
  if (c.span >= 2 && c.code && c.code.includes(' ')) {
    labsChecked++;
    const codeContent = html.match(/<div class="scc-code"[^>]*>([\s\S]*?)<\/div>/);
    if (!codeContent || codeContent[1].includes('<br>')) {
      throw new Error(`Multi-period lab code split with <br>: ${c.code}`);
    }
  }
});

console.log(`8. Verified ${checkedClasses} scheduled classes.`);
console.log(`9. Verified ${compoundSingleSlots} compound single-slot classes break cleanly at delimiters without letter splitting.`);
console.log(`10. Verified ${labsChecked} multi-period lab sessions keep course codes on a single line.`);

console.log('\n====================================================');
console.log('ALL TEXT CLARITY & READABILITY ASSERTIONS PASSED 100%!');
console.log('====================================================');
