import markdownIt from "markdown-it";
import { Files } from "./files.js";

class Markdown {
    static #md = new markdownIt({ xhtmlOut: true });

    static fileToHTML(filePath) {
        return this.strToHTML(Files.read(filePath));
    }

    static strToHTML(str) {
        return this.#md.render(str);
    }
}

export { Markdown };
