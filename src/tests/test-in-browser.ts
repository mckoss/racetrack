import { assert } from 'chai';

import { Stats } from 'mocha';

type TestResults = {
    stats: Stats,
    failures: number
}

import puppeteer, { Browser, Page } from 'puppeteer';

const HOST = 'http://localhost:8080';

suite('Headless browser tests', () => {
    let browser: Browser;
    let page: Page;

    setup(async () => {
        browser = await puppeteer.launch({ /* dumpio: true */ });
        page = await browser.newPage();
        page.setViewport({
            width: 1080,
            height: 1080
        });

        // Listen for console events on the page
        console.log("Listening to the page console...");
        page.on('console', (message) => {
            // Strip out the %s placeholders in the console message.
            console.log(message.text().replace(/%s */g, ''));
        });

        await page.goto(`${HOST}/test/`);
    });

    teardown(async () => {
        await browser.close();
    });

    // test('screenshot', async () => {
    //   await page.screenshot({ path: 'docs/browser-test.png', fullPage: true });
    // });

    test('Run browser tests.', async () => {
        const testResults: TestResults = await page.evaluate(() => {
            const runner = mocha.run(); // Assumes that the Mocha library is loaded on the page
            return new Promise(resolve => {
                runner.on('end', () => {
                    resolve({
                        stats: runner.stats,
                        failures: runner.failures
                    } as TestResults);
                });
            }) as Promise<TestResults>;
        });

        console.log(`Total tests: ${testResults.stats.tests}`);
        console.log(`Failures: ${testResults.stats.failures}`);
        assert.isAtLeast(testResults.stats.tests, 30);
        assert.equal(testResults.stats.failures, 0);
    });
}).timeout(10000);
