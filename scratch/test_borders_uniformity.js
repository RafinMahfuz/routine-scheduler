const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('TEST SUITE: BORDER UNIFORMITY & CONSISTENCY');
console.log('====================================================\n');

// 1. Audit css/style.css
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

// Check that there are no 3.5px or 5px borders in printing-monochrome or sheet-monochrome
const monoSectionMatch = styleCss.match(/body\.printing-monochrome[\s\S]*?#printAllContainer\.print-monochrome \.sheet-legend-swatch\s*\{[^}]*\}/);
if (!monoSectionMatch) throw new Error('Could not find body.printing-monochrome section');
const monoSection = monoSectionMatch[0];

const hasThickBorderLeft = /border-left:\s*(3\.5px|5px)/.test(monoSection);
console.log('1. No 3.5px or 5px border-left in monochrome print styles:', !hasThickBorderLeft);
if (hasThickBorderLeft) throw new Error('Found thick border-left in monochrome print styles');

const hasThickBorderRight = /border-right:\s*2px/.test(monoSection);
console.log('2. No 2px border-right on row labels in monochrome print:', !hasThickBorderRight);
if (hasThickBorderRight) throw new Error('Found 2px border-right in monochrome print styles');

const hasThickMeeting = /\.sheet-meeting\s*\{[^}]*border:\s*2px/.test(monoSection);
console.log('3. No 2px border on meeting block in monochrome print:', !hasThickMeeting);
if (hasThickMeeting) throw new Error('Found 2px border on meeting block in monochrome print styles');

const hasThickLegendTop = /\.sheet-legend\s*\{[^}]*border-top:\s*2px/.test(monoSection);
console.log('4. No 2px border-top on legend in monochrome print:', !hasThickLegendTop);
if (hasThickLegendTop) throw new Error('Found 2px border-top on legend in monochrome print styles');

const hasThickHeaderBottom = /\.sheet-header\s*\{[^}]*border-bottom:\s*2px/.test(monoSection);
console.log('5. No 2px border-bottom on header in monochrome print:', !hasThickHeaderBottom);
if (hasThickHeaderBottom) throw new Error('Found 2px border-bottom on header in monochrome print styles');

const legendHeadBlack = /\.sheet-legend-table th\s*\{[^}]*background:\s*#000000/i.test(monoSection);
console.log('6. Legend table header background is not black #000000 (uses harmonious header style):', !legendHeadBlack);
if (legendHeadBlack) throw new Error('Legend table header still uses black background');

// 2. Audit js/routine.js
const routineJs = fs.readFileSync(path.join(__dirname, '../js/routine.js'), 'utf8');

// Check sheetClassCellHtml
const cellStyleMatch = routineJs.match(/const cellStyle = isMono\s*\?\s*`([^`]+)`/);
if (!cellStyleMatch) throw new Error('Could not find cellStyle in routine.js');
const monoCellStyle = cellStyleMatch[1];
console.log('7. Mono cellStyle has no 3.5px or 5px border:', !monoCellStyle.includes('3.5px') && !monoCellStyle.includes('5px'));
console.log('8. Mono cellStyle specifies border:1px solid #000000:', monoCellStyle.includes('border:1px solid #000000'));
if (monoCellStyle.includes('3.5px') || monoCellStyle.includes('5px') || !monoCellStyle.includes('border:1px solid #000000')) {
  throw new Error('Mono cellStyle in routine.js is not uniform 1px solid #000000');
}

// Check rowLabelStyle
const rowLabelMatch = routineJs.match(/const rowLabelStyle = isMono\s*\?\s*'([^']+)'/);
if (!rowLabelMatch) throw new Error('Could not find rowLabelStyle in routine.js');
console.log('9. Mono rowLabelStyle has no border-right:2px:', !rowLabelMatch[1].includes('2px'));
if (rowLabelMatch[1].includes('2px')) throw new Error('Mono rowLabelStyle still has 2px border');

// Check meetingStyle
const meetingMatch = routineJs.match(/const meetingStyle = isMono\s*\?\s*'([^']+)'/);
if (!meetingMatch) throw new Error('Could not find meetingStyle in routine.js');
console.log('10. Mono meetingStyle has border: 1px solid (no 2px):', meetingMatch[1].includes('border: 1px solid #000000') && !meetingMatch[1].includes('2px'));
if (meetingMatch[1].includes('2px')) throw new Error('Mono meetingStyle still has 2px border');

console.log('\n====================================================');
console.log('ALL BORDER UNIFORMITY TESTS PASSED 100%!');
console.log('====================================================');

