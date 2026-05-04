import puppeteer from "puppeteer";
import { Files } from "../files.js";

export class Browser {
    /** @type {puppeteer.Browser|undefined} */
    #browser;

    async close() {
        if (this.#browser !== undefined) {
            await this.#browser.close();
        }
    }

    /**
     * @returns {Promise<puppeteer.Page>}
     */
    async getBrowserPage() {
        if (this.#browser === undefined) {
            this.#browser = await puppeteer.launch({
                headless: false,
                args: [
                    "--disable-blink-features=AutomationControlled", // Critical: Hides automation flag
                    "--no-sandbox", // Required for environments without Chrome sandbox (e.g., Docker)
                    "--disable-setuid-sandbox",
                    "--window-size=1920,1080", // Realistic viewport
                ],
                defaultViewport: { width: 1920, height: 1080 },
            });
        }
        return this.#browser.newPage();
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
}
