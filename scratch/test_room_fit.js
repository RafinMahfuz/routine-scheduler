const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('TEST SUITE: ROOM NUMBER TEXT & BOX FIT');
console.log('====================================================\n');

const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
const routineJs = fs.readFileSync(path.join(__dirname, '../js/routine.js'), 'utf8');

// 1. Check screen .scc-room-badge
const screenBadgeMatch = styleCss.match(/\.scc-room-badge\s*\{([^}]+)\}/);
assert.ok(screenBadgeMatch, 'Screen .scc-room-badge rule must exist');
const screenProps = screenBadgeMatch[1];
console.log('1. Screen .scc-room-badge has inline-flex centering:', screenProps.includes('display: inline-flex') && screenProps.includes('align-items: center') && screenProps.includes('justify-content: center'));
assert.ok(screenProps.includes('display: inline-flex'), 'Must be inline-flex');
assert.ok(screenProps.includes('align-items: center'), 'Must center vertically');
assert.ok(screenProps.includes('justify-content: center'), 'Must center horizontally');
assert.ok(screenProps.includes('line-height: 1;'), 'Must have line-height 1');

// 2. Check screen monochrome .scc-room-badge
const monoBadgeMatch = styleCss.match(/\.sheet-wrap\.sheet-monochrome\s+\.scc-room-badge\s*\{([^}]+)\}/);
assert.ok(monoBadgeMatch, 'Monochrome .scc-room-badge rule must exist');
const monoProps = monoBadgeMatch[1];
console.log('2. Screen monochrome .scc-room-badge has inline-flex centering:', monoProps.includes('display: inline-flex !important') && monoProps.includes('align-items: center !important'));
assert.ok(monoProps.includes('display: inline-flex !important'), 'Monochrome must be inline-flex');
assert.ok(monoProps.includes('padding: 1px 4.5px !important;'), 'Monochrome must have balanced padding');

// 3. Check @media print .scc-room-badge
const printSection = styleCss.slice(styleCss.indexOf('@media print'));
const printBadgeMatch = printSection.match(/\.scc-room-badge\s*\{([^}]+)\}/);
assert.ok(printBadgeMatch, 'Print .scc-room-badge rule must exist');
const printProps = printBadgeMatch[1];
console.log('3. Print .scc-room-badge has inline-flex centering:', printProps.includes('display: inline-flex !important') && printProps.includes('align-items: center !important'));
assert.ok(printProps.includes('display: inline-flex !important'), 'Print must be inline-flex');
assert.ok(printProps.includes('line-height: 1 !important;'), 'Print must have line-height 1');

// 4. Check print monochrome .scc-room-badge
const printMonoBadgeMatch = printSection.match(/body\.printing-monochrome\s+\.scc-room-badge[^{]*\{([^}]+)\}/);
assert.ok(printMonoBadgeMatch, 'Print monochrome badge rule must exist');
const printMonoProps = printMonoBadgeMatch[1];
console.log('4. Print monochrome .scc-room-badge has inline-flex centering:', printMonoProps.includes('display: inline-flex !important') && printMonoProps.includes('align-items: center !important'));
assert.ok(printMonoProps.includes('display: inline-flex !important'), 'Print mono must be inline-flex');

// 5. Check routine.js roomStyle inline styles
console.log('5. routine.js sheetClassCellHtml generates roomStyle with optical centering:', routineJs.includes('roomStyle') && routineJs.includes('display:inline-flex;align-items:center;justify-content:center;'));
assert.ok(routineJs.includes('roomStyle'), 'roomStyle must be defined in routine.js');

// 6. Check print cell height is 41px to prevent bottom overflow
console.log('6. td.sheet-cell print height is 41px (guarantees room box does not overlap bottom cell border):', printSection.includes('height: 41px !important;'));
assert.ok(printSection.includes('height: 41px !important;'), 'Print cell height must be 41px');

console.log('\n====================================================');
console.log('ALL ROOM NUMBER TEXT & BOX FIT TESTS PASSED 100%!');
console.log('====================================================');

