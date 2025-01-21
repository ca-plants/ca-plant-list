import { Glossary } from "../plants/glossary.js";
import { Markdown } from "../markdown.js";
import { HTML } from "../html.js";
import { Files } from "../files.js";

const ENTRY_DIR = "g";

class GlossaryPages {
    #siteGenerator;
    #glossary;

    /**
     * @param {import("../sitegenerator.js").SiteGenerator} siteGenerator
     */
    constructor(siteGenerator) {
        this.#siteGenerator = siteGenerator;
        this.#glossary = new Glossary();
    }

    /**
     * @param {GlossaryEntry} entry
     */
    #generateEntryPage(entry) {
        const title = entry.getTermName();
        let html = HTML.textElement("h1", title);
        html += HTML.wrap("div", Markdown.strToHTML(entry.getMarkdown()), {
            class: "glossary",
        });
        this.#siteGenerator.writeTemplate(
            html,
            { title: title },
            Files.join(ENTRY_DIR, title + ".html"),
        );
    }

    #generateEntryPages() {
        // Make sure output directory exists.
        this.#siteGenerator.mkdir(ENTRY_DIR);

        const entries = this.#glossary.getEntries();
        for (const entry of entries) {
            this.#generateEntryPage(entry);
        }
    }

    #generateIndexPage() {
        const links = [];
        const entries = this.#glossary.getEntries();
        for (const entry of entries) {
            links.push(
                HTML.getLink(
                    Files.join(ENTRY_DIR, entry.getHTMLFileName()),
                    entry.getTermName(),
                ),
            );
        }
        let html = HTML.wrap("h1", "Glossary");
        html += HTML.wrap("ol", HTML.arrayToLI(links));
        this.#siteGenerator.writeTemplate(
            html,
            { title: "Glossary" },
            "glossary.html",
        );
    }

    getGlossary() {
        return this.#glossary;
    }

    renderPages() {
        this.#generateIndexPage();
        this.#generateEntryPages();
    }
}

export { GlossaryPages };
