const fs = require('fs');
const vm = require('vm');

const dataCode = fs.readFileSync('js/data.js', 'utf8');
const utilsCode = fs.readFileSync('js/utils.js', 'utf8');
const routineCode = fs.readFileSync('js/routine.js', 'utf8');

const sandbox = {
  localStorage: { getItem: () => null, setItem: () => { } },
  window: { addEventListener: () => { } },
  document: { createElement: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }), body: { classList: { add: () => { }, remove: () => { } } }, getElementById: () => null, querySelectorAll: () => [] },
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataCode + '\n' + utilsCode + '\n' + routineCode + '\nglobalThis.state = state; globalThis.seedData = seedData; globalThis.sheetClassCellHtml = sheetClassCellHtml;', sandbox);
sandbox.seedData();

// Pick a class with compound initials like MFA+NIS
const sampleClass = sandbox.state.classes.find(c => c.initials && c.initials.includes('+'));
console.log('Sample class:', sampleClass.code, sampleClass.initials);

const htmlColor = sandbox.sheetClassCellHtml(sampleClass, false, false);
console.log('Generated Color HTML:\n', htmlColor);

const htmlMono = sandbox.sheetClassCellHtml(sampleClass, false, true);
console.log('Generated Mono HTML:\n', htmlMono);

// Check assertions
const hasEmoji = htmlColor.includes('👤') || htmlMono.includes('👤');
const hasWbr = htmlColor.includes('<wbr>') && htmlMono.includes('<wbr>');

console.log('Contains emoji:', hasEmoji, '(expected false)');
console.log('Contains <wbr> soft break:', hasWbr, '(expected true)');

if (!hasEmoji && hasWbr) {
  console.log('✓ SUCCESS: sheetClassCellHtml rendered cleanly without emoji bloat and with soft breaks!');
} else {
  console.error('✗ FAILED: assertion failed');
  process.exit(1);
}
