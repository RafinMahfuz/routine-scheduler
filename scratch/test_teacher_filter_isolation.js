const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('TESTING TEACHER FILTER ISOLATION: MAH vs MHS');
console.log('====================================================\n');

const ctx = {
  window: {},
  document: { getElementById: () => null, querySelectorAll: () => [] },
  console,
  localStorage: { getItem: () => null, setItem: () => {} }
};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync('js/utils.js', 'utf8') + '\n' +
  fs.readFileSync('js/data.js', 'utf8') + '\n' +
  fs.readFileSync('js/routine.js', 'utf8') + '\n' +
  'this.state = state; this.classMatchesTeacherFilter = classMatchesTeacherFilter; this.teacherCodesForClass = teacherCodesForClass; this.seedData = seedData;',
  ctx
);
ctx.seedData();

// Find MAH and MHS classes
const mahPureClass = ctx.state.classes.find(c => c.initials === 'MAH');
const mahCompoundClass = ctx.state.classes.find(c => c.initials && c.initials.includes('MAH+'));
const mhsClass = ctx.state.classes.find(c => c.initials === 'MHS');

console.log('MAH Pure Class:', mahPureClass.code, mahPureClass.initials);
console.log('MAH Compound Class:', mahCompoundClass.code, mahCompoundClass.initials);
console.log('MHS Class:', mhsClass.code, mhsClass.initials);

// Filter by MAH
ctx.state.routineTeacherFilter = 'MAH';
const mahMatchesMah = ctx.classMatchesTeacherFilter(mahPureClass);
const mahCompoundMatchesMah = ctx.classMatchesTeacherFilter(mahCompoundClass);
const mhsMatchesMah = ctx.classMatchesTeacherFilter(mhsClass);

console.log('\nWhen state.routineTeacherFilter = "MAH":');
console.log('  MAH Pure Class matches:', mahMatchesMah);
console.log('  MAH Compound Class matches:', mahCompoundMatchesMah);
console.log('  MHS Class matches:', mhsMatchesMah);

if (mahMatchesMah !== true) {
  console.error('✗ FAIL: MAH course did not match MAH filter');
  process.exit(1);
}
if (mahCompoundMatchesMah !== true) {
  console.error('✗ FAIL: Compound MAH course did not match MAH filter');
  process.exit(1);
}
if (mhsMatchesMah !== false) {
  console.error('✗ FAIL: MHS course matched MAH filter!');
  process.exit(1);
}

// Filter by MHS
ctx.state.routineTeacherFilter = 'MHS';
const mhsMatchesMhs = ctx.classMatchesTeacherFilter(mhsClass);
const mahMatchesMhs = ctx.classMatchesTeacherFilter(mahPureClass);

console.log('\nWhen state.routineTeacherFilter = "MHS":');
console.log('  MHS Class matches:', mhsMatchesMhs);
console.log('  MAH Class matches:', mahMatchesMhs);

if (mhsMatchesMhs !== true) {
  console.error('✗ FAIL: MHS course did not match MHS filter');
  process.exit(1);
}
if (mahMatchesMhs !== false) {
  console.error('✗ FAIL: MAH course matched MHS filter!');
  process.exit(1);
}

// Check other potential substring clashes
// E.g., teacher "SA" (Prof. Dr. Tara Ahmed) vs "MFA" (Md. Faisal Ahmed)
const saClass = ctx.state.classes.find(c => ctx.teacherCodesForClass(c).includes('SA'));
const mfaClass = ctx.state.classes.find(c => ctx.teacherCodesForClass(c).includes('MFA'));
if (saClass && mfaClass) {
  ctx.state.routineTeacherFilter = 'SA';
  console.log('\nWhen state.routineTeacherFilter = "SA":');
  console.log('  SA Class matches:', ctx.classMatchesTeacherFilter(saClass));
  console.log('  MFA Class matches (contains "sa" in full name):', ctx.classMatchesTeacherFilter(mfaClass));
  if (ctx.classMatchesTeacherFilter(mfaClass) === true) {
    console.error('✗ FAIL: MFA matched SA filter due to substring in full name!');
    process.exit(1);
  }
}

console.log('\n====================================================');
console.log('ALL TEACHER FILTER ISOLATION TESTS PASSED 100%!');
console.log('====================================================');

