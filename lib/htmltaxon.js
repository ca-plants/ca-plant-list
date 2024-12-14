import { Config } from "./config.js";
import { DateUtils } from "./dateutils.js";
import { HTML } from "./html.js";
import { Markdown } from "./markdown.js";
import { RarePlants } from "./rareplants.js";
import { TextUtils } from "./textutils.js";

/**
 * @type {Record<string,{title:string,data:function (Taxon):string}>}
 */
const TAXA_LIST_COLS = {
    CESA: {
        title: "California",
        data: (t) => RarePlants.getCESADescription(t.getCESA()),
    },
    COMMON_NAME: {
        title: "Common Name",
        data: (t) => t.getCommonNames().join(", "),
    },
    CNPS_RANK: {
        title: "CNPS Rank",
        data: (t) =>
            HTML.getToolTip(
                HTML.textElement("span", t.getRPIRankAndThreat()),
                t.getRPIRankAndThreatTooltip(),
            ),
    },
    FESA: {
        title: "Federal",
        data: (t) => RarePlants.getFESADescription(t.getFESA()),
    },
    SPECIES: {
        title: "Species",
        data: (t) => t.getHTMLLink(true, true),
    },
    SPECIES_BARE: {
        title: "Species",
        data: (t) => t.getHTMLLink(true, false),
    },
};

const DEFAULT_TAXA_COLUMNS = [
    TAXA_LIST_COLS.SPECIES,
    TAXA_LIST_COLS.COMMON_NAME,
];

class HTMLTaxon {
    /**
     * @param {Taxon} taxon
     * @returns {string|undefined}
     */
    static getCalscapeLink(taxon) {
        const calscapeCN = taxon.getCalscapeCommonName();
        if (!calscapeCN) {
            return;
        }
        return HTML.getLink(
            `https://www.calscape.org/${taxon.getCalscapeName().replaceAll(" ", "-")}-()`,
            "Calscape",
            {},
            true,
        );
    }

    /**
     * @param {string[]|undefined} colors
     */
    static getFlowerColors(colors, includeColorLink = true) {
        let html = "";
        if (colors) {
            for (const color of colors) {
                const img = HTML.textElement("img", "", {
                    src: "./i/f-" + color + ".svg",
                    alt: color + " flowers",
                    title: color,
                    class: "flr-color",
                });
                if (includeColorLink) {
                    html += HTML.wrap("a", img, {
                        href: "./list_fc_" + color + ".html",
                    });
                } else {
                    html += img;
                }
            }
        }
        return html;
    }

    /**
     * @param {Taxon} taxon
     * @param {string} classNames
     * @param {boolean} [includeColorLink=true]
     */
    static getFlowerInfo(
        taxon,
        classNames = "section",
        includeColorLink = true,
    ) {
        const lifeCycle = taxon.getLifeCycle();
        const colors = taxon.getFlowerColors();
        const monthStart = taxon.getBloomStart();
        const monthEnd = taxon.getBloomEnd();

        const parts = [];
        if (lifeCycle) {
            const text =
                HTML.wrap("span", TextUtils.ucFirst(lifeCycle), "lc") + ".";
            parts.push(HTML.wrap("span", text, "lcs"));
        }

        if (colors || monthStart) {
            let html = "Flowers: ";
            html += this.getFlowerColors(colors, includeColorLink);
            if (monthStart && monthEnd) {
                html += HTML.wrap(
                    "span",
                    DateUtils.getMonthName(monthStart) +
                        "-" +
                        DateUtils.getMonthName(monthEnd),
                    { class: "flr-time" },
                );
            }
            parts.push(HTML.wrap("span", html));
        }
        return parts.length === 0
            ? ""
            : HTML.wrap("div", parts.join(""), { class: classNames });
    }

    /**
     * @param {Taxon} taxon
     * @returns {string}
     */
    static getFooterHTML(taxon) {
        const footerTextPath =
            Config.getPackageDir() +
            "/data/text/" +
            taxon.getBaseFileName() +
            ".footer.md";
        return HTMLTaxon.getMarkdownSection(footerTextPath);
    }

    /**
     * @param {Taxon} taxon
     */
    static getLink(taxon) {
        return (
            HTML.getLink(taxon.getFileName(), taxon.getName()) +
            this.getFlowerColors(taxon.getFlowerColors())
        );
    }

    /**
     * @param {string[]} list
     * @param {string} header
     * @param {string} [className]
     */
    static getListSectionHTML(list, header, className) {
        let html = "";
        if (list.length > 0) {
            html += `<div class="section nobullet${className ? " " + className : ""}">`;
            html += HTML.textElement("h2", header);
            html += "<ul>";
            html += HTML.arrayToLI(list);
            html += "</ul>";
            html += "</div>";
        }
        return html;
    }

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

    /**
     * @param {Taxon[]} taxa
     * @param {TaxaCol[]} [columns]
     */
    static getTaxaTable(taxa, columns = DEFAULT_TAXA_COLUMNS) {
        let html = "<table><thead>";
        for (const col of columns) {
            const className = col.class;
            const atts = className !== undefined ? className : {};
            html += HTML.textElement("th", col.title, atts);
        }
        html += "</thead>";
        html += "<tbody>";

        for (const taxon of taxa) {
            html += "<tr>";
            for (const col of columns) {
                const data = col.data(taxon);
                const className = col.class;
                const atts = className !== undefined ? className : {};
                html += HTML.wrap("td", data, atts);
            }
            html += "</tr>";
        }

        html += "</tbody>";
        html += "</table>";

        return html;
    }
}

export { HTMLTaxon, TAXA_LIST_COLS };
