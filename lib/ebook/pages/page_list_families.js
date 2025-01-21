import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";

class PageListFamilies extends EBookPage {
    #families;

    /**
     * @param {string} outputDir
     * @param {import("../../families.js").Families} families
     */
    constructor(outputDir, families) {
        super(outputDir + "/list_families.html", "All Families");
        this.#families = families;
    }

    renderPageBody() {
        const html = XHTML.textElement("h1", this.getTitle());

        const links = [];
        for (const family of this.#families.getFamilies()) {
            if (!family.getTaxa()) {
                continue;
            }
            links.push(XHTML.getLink(family.getFileName(), family.getName()));
        }

        return html + XHTML.wrap("ol", XHTML.arrayToLI(links));
    }
}

export { PageListFamilies };
