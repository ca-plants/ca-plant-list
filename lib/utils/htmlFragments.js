import { HTML } from "../html.js";
import { Markdown } from "../markdown.js";

/**
 * Utilities to create HTML fragments specific to ca-plant-list.
 */
export class HTMLFragments {
    /**
     * @param {string} filePath
     * @returns {string}
     */
    static getMarkdownSection(filePath) {
        const footerMarkdown = Markdown.fileToHTML(filePath);
        if (footerMarkdown) {
            return HTML.wrap("div", footerMarkdown, "section");
        }
        return "";
    }
}
