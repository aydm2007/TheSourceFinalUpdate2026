// Performance profiling script using Puppeteer
// Measures FPS and request latency for the chat dashboard
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard.html');
  // Wait for chat UI to load
  await page.waitForSelector('#chat-form');
  // Measure FPS for 5 seconds
  const fps = await page.evaluate(() => {
    return new Promise(resolve => {
      let frames = 0;
      const start = performance.now();
      function tick() {
        frames++;
        if (performance.now() - start < 5000) {
          requestAnimationFrame(tick);
        } else {
          resolve(frames / 5);
        }
      }
      requestAnimationFrame(tick);
    });
  });
  // Measure latency of a mock API call (replace with actual endpoint if needed)
  const latency = await page.evaluate(() => {
    const start = performance.now();
    return fetch('https://api.sigma.example.com/v1/ping')
      .then(r => r.json())
      .then(() => performance.now() - start)
      .catch(() => -1);
  });
  console.log(JSON.stringify({fps, latency}, null, 2));
  await browser.close();
})();
