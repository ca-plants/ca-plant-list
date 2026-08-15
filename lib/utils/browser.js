import path from "node:path";
import puppeteer from "puppeteer";
import { Files } from "../files.js";

export class Browser {
    /** @type {import("puppeteer").Browser} */
    #browser;

    /**
     * @param {import("puppeteer").Browser} browser
     */
    constructor(browser) {
        this.#browser = browser;
    }

    /**
     * @returns {Promise<import("puppeteer").Page>}
     */
    async getBrowserPage() {
        return this.#browser.newPage();
    }

    /**
     *
     * @param {boolean} headless
     * @returns {Promise<Browser>}
     */
    static async getInstance(headless) {
        /** @type {import("puppeteer").Browser} */
        const browser = await puppeteer.launch({
            headless: headless,
            args: [
                "--disable-blink-features=AutomationControlled", // Critical: Hides automation flag
                "--no-sandbox", // Required for environments without Chrome sandbox (e.g., Docker)
                "--disable-setuid-sandbox",
                "--window-size=1920,1080", // Realistic viewport
            ],
            defaultViewport: { width: 1920, height: 1080 },
        });
        return new Browser(browser);
    }

    /**
     * @param {string} downloadPath
     * @returns {Promise<import("puppeteer").CDPSession>}
     */
    async getSession(downloadPath) {
        // See https://stackoverflow.com/questions/53471235/how-to-wait-for-all-downloads-to-complete-with-puppeteer
        const session = await this.#browser.target().createCDPSession();
        await session.send("Browser.setDownloadBehavior", {
            behavior: "allowAndName",
            downloadPath: path.resolve(downloadPath),
            eventsEnabled: true,
        });
        return session;
    }

    async close() {
        if (this.#browser !== undefined) {
            await this.#browser.close();
        }
    }

    /**
     * @param {string} url
     * @param {string} filePath
     * @param {string} selector
     */
    async retrieveFromCloudFlare(url, filePath, selector) {
        const page = await this.getBrowserPage();

        await page.goto(url);

        await page.waitForSelector(selector, { timeout: 30000 });
        Files.write(filePath, await page.content());
        await page.close();
    }

    /**
     * @param {import("puppeteer").CDPSession} session
     * @returns {Promise<string>}
     * @see https://stackoverflow.com/questions/53471235/how-to-wait-for-all-downloads-to-complete-with-puppeteer
     * @see https://scrapeops.io/puppeteer-web-scraping-playbook/nodejs-puppeteer-downloading-a-file/#setting-a-custom-download-behaviour
     */
    async waitUntilDownload(session) {
        return new Promise((resolve, reject) => {
            session.on("Browser.downloadProgress", (e) => {
                if (e.state === "completed") {
                    resolve(e.guid);
                } else if (e.state === "canceled") {
                    reject();
                }
            });
        });
    }
}
