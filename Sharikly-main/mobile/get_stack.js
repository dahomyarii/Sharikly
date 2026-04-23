const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('ERROR CONSOLE:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString(), '\n', err.stack);
  });
  await page.goto('http://localhost:8082/');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
