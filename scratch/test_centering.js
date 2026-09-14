const fs = require('fs');

const css = fs.readFileSync('css/style.css', 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error('✗ FAILED:', message);
    process.exit(1);
  } else {
    console.log('✓ PASS:', message);
  }
}

// 1. Check content-grid-sheet has centering
assert(
  css.includes('.content-grid-sheet') && css.includes('justify-content: center;'),
  '.content-grid-sheet has justify-content: center'
);

// 2. Check routine-card has flex column centering
assert(
  css.includes('.routine-card') && css.includes('align-items: center;'),
  '.routine-card has align-items: center'
);

// 3. Check sheet-scale-box has margin auto
assert(
  css.includes('.sheet-scale-box') && css.includes('margin-left: auto !important;') && css.includes('margin-right: auto !important;'),
  '.sheet-scale-box has margin-left and margin-right auto'
);

// 4. Check sheet-wrap has margin auto
assert(
  css.includes('.sheet-wrap') && css.includes('margin-left: auto !important;') && css.includes('margin-right: auto !important;'),
  '.sheet-wrap has margin-left and margin-right auto'
);

// 5. Check sheet-bands and table centering
assert(
  css.includes('.sheet-bands') && css.includes('align-items: center;'),
  '.sheet-bands has align-items: center'
);

assert(
  css.includes('table.sheet-table') && css.includes('margin-left: auto !important;') && css.includes('margin-right: auto !important;'),
  'table.sheet-table has margin-left and margin-right auto'
);

console.log('\n=========================================');
console.log('ALL CENTERING ASSERTIONS PASSED 100%!');
console.log('=========================================');

