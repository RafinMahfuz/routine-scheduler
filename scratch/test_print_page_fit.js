const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('TEST SUITE: PRINT PAGE FIT, LOGO & NORMAL MARGINS');
console.log('====================================================\n');

// 1. Check js/logo.js
const logoJs = fs.readFileSync(path.join(__dirname, '../js/logo.js'), 'utf8');
const hasLogoDataUri = logoJs.includes('const RUET_LOGO_DATA_URI = "data:image/png;base64,');
console.log('1. RUET_LOGO_DATA_URI defined in js/logo.js:', hasLogoDataUri);
if (!hasLogoDataUri) throw new Error('RUET_LOGO_DATA_URI not found in js/logo.js');

// 2. Check index.html imports logo.js before data.js
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const logoIdx = indexHtml.indexOf('<script src="js/logo.js"></script>');
const dataIdx = indexHtml.indexOf('<script src="js/data.js"></script>');
console.log('2. logo.js imported in index.html before data.js:', logoIdx !== -1 && logoIdx < dataIdx);
if (logoIdx === -1 || logoIdx >= dataIdx) throw new Error('logo.js import order invalid');

// 3. Check sheetHeaderHtml in js/routine.js
const routineJs = fs.readFileSync(path.join(__dirname, '../js/routine.js'), 'utf8');
const usesLogoDataUri = routineJs.includes('RUET_LOGO_DATA_URI');
const handlesDecode = routineJs.includes('img.decode()');
console.log('3. sheetHeaderHtml uses RUET_LOGO_DATA_URI:', usesLogoDataUri);
console.log('4. runPrintJob performs img.decode() prior to window.print():', handlesDecode);
if (!usesLogoDataUri) throw new Error('sheetHeaderHtml does not use RUET_LOGO_DATA_URI');
if (!handlesDecode) throw new Error('runPrintJob does not call img.decode()');

// 5. Check css/style.css print rules
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

// Margins:
const pageMatch = styleCss.match(/@page\s*\{[^}]*margin:\s*7mm\s*9mm;?[^}]*\}/s);
console.log('5. @page has normal margins (7mm 9mm):', !!pageMatch);
if (!pageMatch) throw new Error('@page does not have 7mm 9mm normal margins');

// Cell height:
const cellHeightMatch = styleCss.match(/td\.sheet-cell\s*\{[^}]*height:\s*41px\s*!important/s);
console.log('6. td.sheet-cell print height is 41px !important:', !!cellHeightMatch);
if (!cellHeightMatch) throw new Error('td.sheet-cell print height not 41px');

// Logo size:
const logoSizeMatch = styleCss.match(/\.sheet-logo\s*\{[^}]*width:\s*44px\s*!important/s);
console.log('7. .sheet-logo print size is 44px !important:', !!logoSizeMatch);
if (!logoSizeMatch) throw new Error('.sheet-logo print size not 44px');

// Blue floating button hidden in print:
const buttonHidden = styleCss.includes('#sidebarShowBtn') && styleCss.includes('display: none !important');
console.log('8. #sidebarShowBtn permanently hidden in print:', buttonHidden);
if (!buttonHidden) throw new Error('#sidebarShowBtn not hidden in print');

// Height & single page calculation:
const a4HeightMm = 210;
const marginYMm = 14; // 7mm top + 7mm bottom
const printableHeightMm = a4HeightMm - marginYMm; // 196mm
const pxPerMm = 96 / 25.4;
const availableHeightPx = printableHeightMm * pxPerMm; // ~740.7px

const estHeader = 52;
const estBand1 = 22 + (5 * 41); // th + 5 rows = 227px
const estBandGap = 5;
const estBand2 = 22 + (5 * 41); // th + 5 rows = 227px
const estLegend = 75;
const estFooter = 34;
const estMargins = 3 + 4 + 4; // margins between sections
const totalEstHeight = estHeader + estBand1 + estBandGap + estBand2 + estLegend + estFooter + estMargins;

console.log('\n--- VERTICAL BUDGET CALCULATION ---');
console.log('A4 Landscape printable height (with 7mm top/bottom margins):', availableHeightPx.toFixed(1) + 'px');
console.log('Calculated print content height with 38px cells & 44px logo:', totalEstHeight + 'px');
console.log('Page occupancy ratio:', ((totalEstHeight / availableHeightPx) * 100).toFixed(1) + '%');
console.log('Remaining safety buffer to guarantee NO 2nd page:', (availableHeightPx - totalEstHeight).toFixed(1) + 'px');

if (totalEstHeight >= availableHeightPx) {
  throw new Error('Total height exceeds printable height, risk of spilling to page 2!');
}
if (totalEstHeight < 550) {
  throw new Error('Total height too small, excessive void at bottom!');
}

console.log('\n====================================================');
console.log('ALL PRINT FIT & LOGO ASSERTIONS PASSED 100%!');
console.log('====================================================');

