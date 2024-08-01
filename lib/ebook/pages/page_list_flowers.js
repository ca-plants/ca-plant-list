import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";
import { DateUtils } from "../../dateutils.js";
import { EBook } from "../ebook.js";

const FN_FLOWER_TIME_INDEX = "fm.html";

class PageListFlowers {
    /**
     * @param {string} contentDir
     * @param {Taxa} taxa
     */
    static createPages(contentDir, taxa) {
        new PageListFlowerTimeIndex(contentDir).create();
        for (let m1 = 1; m1 < 13; m1++) {
            new PageListFlowerTime(contentDir, taxa, m1).create();
        }
    }

    static getManifestEntries() {
        const manifestEntries = [];

        manifestEntries.push(
            EBook.getManifestEntry("fm0", FN_FLOWER_TIME_INDEX)
        );
        for (let m1 = 1; m1 < 13; m1++) {
            manifestEntries.push(
                EBook.getManifestEntry(
                    "fm" + m1,
                    PageListFlowerTime.getFileNameBloomTime(m1)
                )
            );
        }

        return manifestEntries.join("");
    }

    static getSpineEntries() {
        const spineEntries = [];

        spineEntries.push(EBook.getSpineEntry("fm0"));
        for (let m1 = 1; m1 < 13; m1++) {
            spineEntries.push(EBook.getSpineEntry("fm" + m1));
        }

        return spineEntries.join("");
    }

    static renderMonthLinks() {
        const links = [];
        for (let m1 = 1; m1 < 13; m1++) {
            links.push(
                XHTML.getLink(
                    PageListFlowerTime.getFileNameBloomTime(m1),
                    DateUtils.getMonthName(m1) +
                        " - " +
                        DateUtils.getMonthName((m1 % 12) + 1)
                )
            );
        }
        return XHTML.wrap("ol", XHTML.arrayToLI(links));
    }
}

class PageListFlowerTimeIndex extends EBookPage {
    /**
     * @param {string} outputDir
     */
    constructor(outputDir) {
        super(outputDir + "/" + FN_FLOWER_TIME_INDEX, "Flowering Times");
    }

    renderPageBody() {
        const html = XHTML.textElement("h1", this.getTitle());
        return html + PageListFlowers.renderMonthLinks();
    }
}

class PageListFlowerTime extends EBookPage {
    #taxa;
    #m1;
    #m2;

    /**
     * @param {string} outputDir
     * @param {Taxa} taxa
     * @param {number} month
     */
    constructor(outputDir, taxa, month) {
        super(
            outputDir + "/" + PageListFlowerTime.getFileNameBloomTime(month),
            "Flowering in " +
                DateUtils.getMonthName(month) +
                " - " +
                DateUtils.getMonthName((month % 12) + 1)
        );
        this.#taxa = taxa;
        this.#m1 = month;
        this.#m2 = (month % 12) + 1;
    }

    /**
     * @param {number} m1
     */
    static getFileNameBloomTime(m1) {
        return "list_fm_" + m1 + ".html";
    }

    renderPageBody() {
        const html = XHTML.textElement("h1", this.getTitle());

        /** @type {[number,number]} */
        const range = [this.#m1, this.#m2];
        const links = [];
        for (const taxon of this.#taxa.getTaxonList()) {
            const m1 = taxon.getBloomStart();
            const m2 = taxon.getBloomEnd();
            if (m1 && m2 && DateUtils.monthRangesOverlap(range, [m1, m2])) {
                links.push(XHTML.getLink(taxon.getFileName(), taxon.getName()));
            }
        }

        return html + XHTML.wrap("ol", XHTML.arrayToLI(links));
    }
}

export { PageListFlowers, PageListFlowerTime };
