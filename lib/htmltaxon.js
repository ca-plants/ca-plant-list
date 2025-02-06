import { Config } from "./config.js";
import { DateUtils } from "./dateutils.js";
import { ExternalSites } from "./externalsites.js";
import { HTML } from "./html.js";
import { Markdown } from "./markdown.js";
import { RarePlants } from "./rareplants.js";
import { TextUtils } from "./textutils.js";

/**
 * @typedef {{
    class?: string;
    data: (taxon: import("./types.js").Taxon) => string;
    title: string;
     }} TaxaColDef
 */

/**
 * @type {Record<string,TaxaColDef>}
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
                HTMLTaxon.getRPIRankAndThreatTooltip(t),
            ),
    },
    FESA: {
        title: "Federal",
        data: (t) => RarePlants.getFESADescription(t.getFESA()),
    },
    SPECIES: {
        title: "Species",
        data: (t) => HTMLTaxon.getHTMLLink(t, true, true),
    },
    SPECIES_BARE: {
        title: "Species",
        data: (t) => HTMLTaxon.getHTMLLink(t, true, false),
    },
};

/** @type {TaxaColDef[]} */
const DEFAULT_TAXA_COLUMNS = [
    TAXA_LIST_COLS.SPECIES,
    TAXA_LIST_COLS.COMMON_NAME,
];

/** @type {Object<string,{label:string,href:function(import("./types.js").Taxon):URL|undefined}>} */
const REFLINKS = {
    calflora: {
        label: "Calflora",
        href: (taxon) => ExternalSites.getCalfloraRefLink(taxon),
    },
    calscape: {
        label: "Calscape",
        href: (taxon) => ExternalSites.getCalscapeLink(taxon),
    },
    cch: {
        label: "CCH2",
        href: (taxon) => ExternalSites.getCCH2RefLink(taxon),
    },
    fna: {
        label: "Flora of North America",
        href: (taxon) => ExternalSites.getFNARefLink(taxon),
    },
    inat: {
        label: "iNaturalist",
        href: (taxon) => ExternalSites.getINatRefLink(taxon),
    },
    rpi: {
        label: "CNPS Rare Plant Inventory",
        href: (taxon) => ExternalSites.getRPIRefLink(taxon),
    },
};

class HTMLTaxon {
    /**
     * @param {string[]} links
     * @param {URL|string|undefined} href
     * @param {string} label
     * @param {string} [suffix=""]
     */
    static addLink(links, href, label, suffix = "") {
        if (href === undefined) {
            return;
        }
        const link = HTML.getLink(href.toString(), label, {}, true);
        links.push(link + suffix);
    }

    /**
     * @param {string[]} links
     * @param {import("./types.js").Taxon} taxon
     * @param {import("./index.js").RefSourceCode} sourceCode
     * @param {string} [suffix=""]
     */
    static addRefLink(links, taxon, sourceCode, suffix = "") {
        const source = REFLINKS[sourceCode];
        this.addLink(links, source.href(taxon), source.label, suffix);
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
     * @param {import("./types.js").Taxon} taxon
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
     * @param {import("./types.js").Taxon} taxon
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
     * @param {import("./types.js").Taxon} taxon
     * @param {boolean|string|undefined} href
     * @param {boolean} includeRPI
     */
    static getHTMLLink(taxon, href = true, includeRPI = true) {
        href = href ? "./" + taxon.getFileName() : undefined;
        let className = taxon.isNative() ? "native" : "non-native";
        let isRare = false;
        if (includeRPI && taxon.isRare()) {
            isRare = true;
            className += " rare";
        }
        const attributes = { class: className };
        const link = HTML.wrap(
            "span",
            HTML.getLink(href, taxon.getName()),
            attributes,
        );
        if (isRare) {
            return HTML.getToolTip(
                link,
                this.getRPIRankAndThreatTooltip(taxon),
                {
                    icon: false,
                },
            );
        }
        return link;
    }

    /**
     * @param {import("./types.js").Taxon} taxon
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
     * @param {import("./types.js").Taxon} taxon
     */
    static getRPIRankAndThreatTooltip(taxon) {
        return RarePlants.getRPIRankAndThreatDescriptions(
            taxon.getRPIRankAndThreat(),
        ).join("<br>");
    }

    /**
     * @param {import("./types.js").Taxon[]} taxa
     * @param {TaxaColDef[]} [columns]
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
