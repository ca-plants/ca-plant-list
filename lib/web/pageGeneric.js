import path from "node:path";
import { Config } from "../config.js";
import { Files } from "../files.js";
import { HTMLFragments } from "../utils/htmlFragments.js";

export class GenericPage {
    #siteGenerator;
    #title;
    #baseFileName;
    #js;

    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {string} title
     * @param {string} baseFileName
     * @param {string} [js]
     */
    constructor(siteGenerator, title, baseFileName, js) {
        this.#siteGenerator = siteGenerator;
        this.#title = title;
        this.#baseFileName = baseFileName;
        this.#js = js;
    }

    getBaseFileName() {
        return this.#baseFileName;
    }

    getDefaultIntro() {
        let html = this.getFrontMatter();
        return html + this.getMarkdown();
    }

    getFrontMatter() {
        return this.#siteGenerator.getFrontMatter({
            title: this.#title,
            js: this.#js,
        });
    }

    getMarkdown() {
        const localTextPath = path.join(
            "./data/intros",
            `${this.#baseFileName}.md`,
        );
        const globalTextPath = path.join(
            Config.getPackageDir(),
            "./data/text/",
            `${this.#baseFileName}.md`,
        );
        return (
            HTMLFragments.getMarkdownSection(localTextPath) +
            HTMLFragments.getMarkdownSection(globalTextPath)
        );
    }

    getOutputDir() {
        return this.#siteGenerator.getBaseDir();
    }

    getSiteGenerator() {
        return this.#siteGenerator;
    }

    getTitle() {
        return this.#title;
    }

    /**
     * @param {string} html
     */
    writeFile(html) {
        Files.write(
            path.join(this.getOutputDir(), `${this.#baseFileName}.html`),
            html,
        );
    }
}
