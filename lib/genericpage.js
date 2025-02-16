import path from "node:path";
import { Config } from "./config.js";
import { Files } from "./files.js";
import { HTMLFragments } from "./utils/htmlFragments.js";

class GenericPage {
    #outputDir;
    #title;
    #baseFileName;
    #js;

    /**
     * @param {string} outputDir
     * @param {string} title
     * @param {string} baseFileName
     * @param {string} [js]
     */
    constructor(outputDir, title, baseFileName, js) {
        this.#outputDir = outputDir;
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
        return (
            "---\n" +
            'title: "' +
            this.#title +
            '"\n' +
            (this.#js ? "js: " + this.#js + "\n" : "") +
            "---\n"
        );
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
        return this.#outputDir;
    }

    getTitle() {
        return this.#title;
    }

    /**
     * @param {string} html
     */
    writeFile(html) {
        Files.write(this.#outputDir + "/" + this.#baseFileName + ".html", html);
    }
}

export { GenericPage };
