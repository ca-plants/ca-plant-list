import { Config } from "../config.js";
import { Files } from "../files.js";

export class Glossary {
    #srcPath;
    /** @type {GlossaryEntry[]} */
    #srcEntries = [];

    constructor() {
        this.#srcPath = Config.getPackageDir() + "/data/glossary";

        // Find all entries in the glossary directory.
        const entries = Files.getDirEntries(this.#srcPath).sort();
        for (const entry of entries) {
            this.#srcEntries.push(new GlossaryEntry(this.#srcPath, entry));
        }
    }

    getEntries() {
        return this.#srcEntries;
    }
}

export class GlossaryEntry {
    #srcPath;
    #fileName;
    #term;

    /**
     * @param {string} srcPath
     * @param {string} fileName
     */
    constructor(srcPath, fileName) {
        this.#srcPath = srcPath;
        this.#fileName = fileName;
        this.#term = fileName.split(".")[0];
    }

    getHTMLFileName() {
        return this.#term + ".html";
    }

    getMarkdown() {
        return Files.read(this.#srcPath + "/" + this.#fileName);
    }

    getTermName() {
        return this.#term;
    }
}
