import markdownIt from "markdown-it";
import { Files } from "./files.js";

class Markdown {
    static #md = new markdownIt({ xhtmlOut: true });

    /**
     * @param {string} filePath
     * @returns {string|undefined}
     */
    static fileToHTML(filePath) {
        if (!Files.exists(filePath)) {
            return;
        }
        return this.strToHTML(Files.read(filePath));
    }

    /**
     * @param {string} str
     */
    static strToHTML(str) {
        return this.#md.render(str);
    }
}

export { Markdown };
