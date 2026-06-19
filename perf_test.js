// Simple performance stub using jsdom (placeholder values)
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve('dashboard.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
// Simulate load time measurement
const loadTime = 120; // ms (placeholder)
// Simulate message send latency
const sendLatency = 45; // ms (placeholder)
// Simulate attachment upload latency
const uploadLatency = 80; // ms (placeholder)
// Simulate audio playback start latency
const audioLatency = 30; // ms (placeholder)
const report = {
  loadTime,
  sendLatency,
  uploadLatency,
  audioLatency,
};
console.log(JSON.stringify(report, null, 2));
