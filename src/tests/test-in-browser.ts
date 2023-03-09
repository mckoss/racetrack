import {assert} from 'chai';

import puppeteer, { Browser, Page } from 'puppeteer';

const HOST = 'http://localhost:8080';

suite('Headless browser tests', () => {
  let browser: Browser;
  let page:  Page;

  setup(async () => {
    browser = await puppeteer.launch({dumpio: true});
    page = await browser.newPage();
    page.setViewport({
      width: 1080,
      height: 1080
    });
    await page.goto(`${HOST}/test/`);
  });

  teardown(async () => {
    await browser.close();
  });

  // test('screenshot', async () => {
  //   await page.screenshot({ path: 'docs/browser-test.png', fullPage: true });
  // });

  test('no initial error shown', async () => {
    const isHidden = await page.$eval('#error', (elem) => {
      return window.getComputedStyle(elem).visibility === 'hidden';
  });
    assert.isTrue(isHidden);
  });
}).timeout(10000);
