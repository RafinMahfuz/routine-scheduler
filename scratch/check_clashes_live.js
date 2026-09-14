const fs = require('fs');
const vm = require('vm');

const dataCode = fs.readFileSync('js/data.js', 'utf8');

const sandbox = {
  localStorage: { getItem: () => null, setItem: () => { } },
  window: { addEventListener: () => { } },
  document: { createElement: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }), body: { classList: { add: () => { }, remove: () => { } } }, getElementById: () => null, querySelectorAll: () => [] },
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataCode + '\nglobalThis.state = state; globalThis.seedData = seedData;', sandbox);
sandbox.seedData();

const clashes = [];
for (let i = 0; i < sandbox.state.classes.length; i++) {
  for (let j = i + 1; j < sandbox.state.classes.length; j++) {
    const a = sandbox.state.classes[i], b = sandbox.state.classes[j];
    if (a.day !== b.day) continue;
    const overlap = a.start < b.start + b.span && b.start < a.start + a.span;
    if (overlap && a.teacherId && a.teacherId === b.teacherId) {
      clashes.push({ a, b });
    }
  }
}
console.log('Seeded teacher time clashes count directly in data.js:', clashes.length);
if (clashes.length > 0) {
  clashes.forEach(c => {
    console.log('Clash on', c.a.day, 'slot', c.a.start, 'span', c.a.span, ':', c.a.code, '(' + c.a.seriesId + ') vs', c.b.code, '(' + c.b.seriesId + ') teacherId:', c.a.teacherId);
  });
  process.exit(1);
} else {
  console.log('✓ SUCCESS: 0 teacher time clashes in seed data!');
}

