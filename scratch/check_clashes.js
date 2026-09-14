const fs = require('fs');
const vm = require('vm');

let dataCode = fs.readFileSync('js/data.js', 'utf8');

// Fix transcription clashes in SEED_CLASSES
dataCode = dataCode.replace('[0, "Saturday", 10, 1, "PHY 1117", "PHY", "MAH", "R-404"]', '[0, "Saturday", 10, 1, "PHY 1117", "PHY", "MFH", "R-404"]');
dataCode = dataCode.replace('[3, "Saturday", 9, 1, "ECE 3205", "ECE", "MFA+MKG", "R-401"]', '[3, "Saturday", 9, 1, "ECE 3205", "ECE", "MKG", "R-401"]');
dataCode = dataCode.replace('[2, "Saturday", 8, 3, "ECE 2200", "Lab", "MAH+NRP+MNT", "Lab-4"]', '[2, "Saturday", 8, 3, "ECE 2200", "Lab", "NRP+MNT", "Lab-4"]');
dataCode = dataCode.replace('[2, "Monday", 8, 3, "ECE 2200", "Lab", "MAH+NRP+MNT", "Lab-4"]', '[2, "Monday", 8, 3, "ECE 2200", "Lab", "NRP+MNT", "Lab-4"]');
dataCode = dataCode.replace('[3, "Saturday", 11, 1, "ECE 3221", "ECE", "HBK+NIS", "R-401"]', '[3, "Saturday", 11, 1, "ECE 3221", "ECE", "NIS", "R-401"]');
dataCode = dataCode.replace('[3, "Monday", 11, 3, "ECE 3221", "Lab", "HBK+NIS", "Lab-2"]', '[3, "Monday", 11, 3, "ECE 3221", "Lab", "NIS", "Lab-2"]');
dataCode = dataCode.replace('[1, "Tuesday", 11, 1, "ECE 2105", "ECE", "MKG+MI", "R-404"]', '[1, "Tuesday", 11, 1, "ECE 2105", "ECE", "MI", "R-404"]');
dataCode = dataCode.replace('[1, "Tuesday", 8, 1, "ECE 2103", "ECE", "MFA+NIS", "R-403"]', '[1, "Tuesday", 8, 1, "ECE 2103", "ECE", "NIS", "R-403"]');
dataCode = dataCode.replace('[2, "Wednesday", 8, 3, "ECE 2214 / 2216", "Lab", "MFA+NRP / NIS+MRI", "Lab-2 / R-401"]', '[2, "Wednesday", 8, 3, "ECE 2214 / 2216", "Lab", "MRI+MI", "Lab-2 / R-401"]');

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
console.log('Seeded teacher time clashes count after fix:', clashes.length);
clashes.forEach(c => {
  console.log('Remaining clash on', c.a.day, 'slot', c.a.start, 'span', c.a.span, ':', c.a.code, '(' + c.a.seriesId + ') vs', c.b.code, '(' + c.b.seriesId + ') teacherId:', c.a.teacherId);
});

