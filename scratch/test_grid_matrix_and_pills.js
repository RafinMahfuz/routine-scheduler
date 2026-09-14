const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('TEST SUITE: REMOVED CRS & DAY COUNTS + GRID MATRIX');
console.log('====================================================\n');

// 1. Check nav.js
const navJs = fs.readFileSync(path.join(__dirname, '../js/nav.js'), 'utf8');

const hasCrsBadge = navJs.includes('crs</span>') || navJs.includes('pill-badge');
const hasDayCount = navJs.includes('day-count');

console.log('1. nav.js series tabs have NO crs count badge:', !hasCrsBadge);
assert.strictEqual(!hasCrsBadge, true, 'Series tabs must not contain crs count pills');

console.log('2. nav.js day filter buttons have NO day number count:', !hasDayCount);
assert.strictEqual(!hasDayCount, true, 'Day filter buttons must not contain count pills');

// 2. Check routine.js Grid Matrix
const routineJs = fs.readFileSync(path.join(__dirname, '../js/routine.js'), 'utf8');

const hasCol1Day = routineJs.includes('<th class="matrix-corner">Day</th>');
console.log('3. Grid Matrix column 1 header is "Day":', hasCol1Day);
assert.strictEqual(hasCol1Day, true, 'Column 1 header should be Day');

const hasGhostCol = routineJs.includes("headerCells += '<th></th>'");
console.log('4. Grid Matrix has NO ghost trailing <th></th> column:', !hasGhostCol);
assert.strictEqual(!hasGhostCol, true, 'Header should not have extra trailing <th></th>');

const usesContentGridMatrix = routineJs.includes("content-grid-matrix");
console.log('5. renderRoutine uses content-grid-matrix:', usesContentGridMatrix);
assert.strictEqual(usesContentGridMatrix, true, 'renderRoutine should use content-grid-matrix');

const hasMatrixBanner = routineJs.includes('class="matrix-banner"');
console.log('6. Grid Matrix has matrix-banner:', hasMatrixBanner);
assert.strictEqual(hasMatrixBanner, true, 'Grid Matrix should render matrix-banner');

const duplicateLegend = (routineJs.match(/class="legend"/g) || []).length;
console.log('7. Grid Matrix legend count in routine.js:', duplicateLegend);
// In routine.js, legend is rendered once in sheet (or legend table) and once in matrix view. 
// Previously lines 1711 and 1712 had two <div class="legend"> back-to-back.
const hasBackToBackLegend = routineJs.includes('<div class="legend">\n    <div class="legend">') ||
    routineJs.includes('<div class="legend"></div>\n    <div class="legend">');
console.log('8. No back-to-back duplicate legend in routine.js:', !hasBackToBackLegend);
assert.strictEqual(!hasBackToBackLegend, true, 'No duplicate back-to-back legend');

// 3. Check css/style.css
const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

const hasMatrixCss = css.includes('.content-grid.content-grid-matrix');
console.log('9. CSS contains .content-grid.content-grid-matrix full-width rules:', hasMatrixCss);
assert.strictEqual(hasMatrixCss, true, 'CSS must include .content-grid.content-grid-matrix');

const hasRoutineTableStyle = css.includes('table.routine');
console.log('10. CSS contains table.routine styling:', hasRoutineTableStyle);
assert.strictEqual(hasRoutineTableStyle, true, 'CSS must include table.routine styling');

console.log('\n====================================================');
console.log('ALL GRID MATRIX & PILL CLEANUP TESTS PASSED 100%!');
console.log('====================================================');

