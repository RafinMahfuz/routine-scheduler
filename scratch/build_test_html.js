const fs = require('fs');
const vm = require('vm');
const path = require('path');

const logoCode = fs.readFileSync(path.join(__dirname, '../js/logo.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const settingsCode = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8');
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
const routineCode = fs.readFileSync(path.join(__dirname, '../js/routine.js'), 'utf8');

const ctx = {
  localStorage: { getItem: () => null, setItem: () => { } },
  window: { addEventListener: () => { } },
  document: {
    createElement: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }),
    body: { classList: { add: () => { }, remove: () => { } } },
    getElementById: () => ({ style: {}, classList: { add: () => { }, remove: () => { } } }),
    querySelectorAll: () => []
  },
  console, setTimeout, clearTimeout, toast: () => { }, renderSeriesTabs: () => { }, openModal: () => { }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(logoCode + '\n' + dataCode + '\n' + settingsCode + '\n' + utilsCode + '\n' + routineCode, ctx);
ctx.seedData();

const sheetHtml = ctx.buildSheetHtml(ctx.state.series, false, ctx.DAYS, false);
const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Routine Sheet Print</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet">
  <style>
  ${css}
  </style>
</head>
<body class="printing-all">
  <div id="printAllContainer">
    ${sheetHtml}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'test_sheet_print.html'), fullHtml, 'utf8');
console.log('Saved test_sheet_print.html successfully!');

