const fs = require('fs');
const vm = require('vm');

const dataCode = fs.readFileSync('js/data.js', 'utf8');

// Simulate legacy stored state containing old clashes
const legacyState = {
  series: [{ id: 1, name: '25 Series' }, { id: 2, name: '24 Series' }, { id: 3, name: '23 Series' }, { id: 4, name: '22 Series' }],
  teachers: [
    { id: 101, shortName: 'MAH', name: 'Md. Al-Hasan' },
    { id: 102, shortName: 'MFH', name: 'Md. Feroz Hossain' },
    { id: 103, shortName: 'MFA', name: 'Md. Firoz Ahmed' },
    { id: 104, shortName: 'MKG', name: 'Md. Khorshed Gani' },
    { id: 105, shortName: 'NIS', name: 'Nazrul Islam Sarker' },
    { id: 106, shortName: 'MI', name: 'Md. Monirul Islam' },
    { id: 107, shortName: 'NRP', name: 'Nahid Raihan Pranto' },
    { id: 108, shortName: 'MRI', name: 'Md. Rafiqul Islam' }
  ],
  classes: [
    { id: 1, code: 'PHY 1117', day: 'Saturday', start: 10, span: 1, initials: 'MAH', teacherId: 101 },
    { id: 2, code: 'ECE 3205', day: 'Saturday', start: 9, span: 1, initials: 'MFA+MKG', teacherId: 103 },
    { id: 3, code: 'ECE 2200', day: 'Saturday', start: 8, span: 3, initials: 'MAH+NRP+MNT', teacherId: 101 },
    { id: 4, code: 'ECE 2105', day: 'Tuesday', start: 11, span: 1, initials: 'MKG+MI', teacherId: 104 },
    { id: 5, code: 'ECE 2103', day: 'Tuesday', start: 8, span: 1, initials: 'MFA+NIS', teacherId: 103 },
    { id: 6, code: 'ECE 2214 / 2216', day: 'Wednesday', start: 8, span: 3, initials: 'MFA+NRP / NIS+MRI', teacherId: 103 }
  ],
  students: new Array(60).fill({ id: 1 }),
  settings: {}
};

const sandbox = {
  localStorage: {
    getItem: (k) => JSON.stringify({ state: legacyState, uid: 2000 }),
    setItem: () => { }
  },
  window: { addEventListener: () => { } },
  document: { createElement: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }), body: { classList: { add: () => { }, remove: () => { } } }, getElementById: () => null, querySelectorAll: () => [] },
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataCode + '\nglobalThis.state = state; globalThis.loadState = loadState;', sandbox);
sandbox.loadState();

console.log('Class 1 initials:', sandbox.state.classes[0].initials, 'teacherId:', sandbox.state.classes[0].teacherId);
console.log('Class 2 initials:', sandbox.state.classes[1].initials, 'teacherId:', sandbox.state.classes[1].teacherId);
console.log('Class 3 initials:', sandbox.state.classes[2].initials, 'teacherId:', sandbox.state.classes[2].teacherId);
console.log('Class 4 initials:', sandbox.state.classes[3].initials, 'teacherId:', sandbox.state.classes[3].teacherId);
console.log('Class 5 initials:', sandbox.state.classes[4].initials, 'teacherId:', sandbox.state.classes[4].teacherId);
console.log('Class 6 initials:', sandbox.state.classes[5].initials, 'teacherId:', sandbox.state.classes[5].teacherId);

const passed = sandbox.state.classes[0].initials === 'MFH' &&
  sandbox.state.classes[1].initials === 'MKG' &&
  sandbox.state.classes[2].initials === 'NRP+MNT' &&
  sandbox.state.classes[3].initials === 'MI' &&
  sandbox.state.classes[4].initials === 'NIS' &&
  sandbox.state.classes[5].initials === 'MRI+MI';

if (passed) {
  console.log('✓ SUCCESS: loadState auto-healing tested and verified!');
} else {
  console.error('✗ FAILED: auto-healing mismatch');
  process.exit(1);
}
