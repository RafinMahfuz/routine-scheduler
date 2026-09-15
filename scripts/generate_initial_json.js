// Helper script to export initial routine data to data/routine.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser globals
global.window = global;
global.sessionStorage = { getItem: () => null, setItem: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { getElementById: () => null, querySelectorAll: () => [] };

const ctx = vm.createContext(global);

// Read and eval data.js
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
vm.runInContext(dataCode, ctx);

// Read and eval settings.js
const settingsCode = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8');
vm.runInContext(settingsCode, ctx);

// Seed data
vm.runInContext('seedData()', ctx);

const extracted = vm.runInContext('({ state, settings: (typeof settings !== "undefined" ? settings : {}), uid })', ctx);

const payload = {
  version: 1,
  updatedAt: Date.now(),
  updatedBy: 'Initial Setup',
  state: extracted.state,
  settings: extracted.settings,
  uid: extracted.uid
};

if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'));
}

fs.writeFileSync(path.join(__dirname, '../data/routine.json'), JSON.stringify(payload, null, 2));
console.log('Successfully generated data/routine.json! Size:', fs.statSync(path.join(__dirname, '../data/routine.json')).size, 'bytes');
