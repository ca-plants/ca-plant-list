import { ExternalSites } from "../externalsites.js";
import { GenericPage } from "./pageGeneric.js";
import { HTML } from "../html.js";
import { HTMLTaxon } from "../htmltaxon.js";
import { Sections } from "../taxonomy/families.js";

export class PageFamilyList extends GenericPage {
    #families;

    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {import("../types.js").Family[]} families
     */
    constructor(siteGenerator, families) {
        super(siteGenerator, "Families", "list_families");
        this.#families = families;
    }

    /**
     * @param {import("../types.js").TaxaColDef[]} [taxaColumns]
     */
    render(taxaColumns) {
        let html = this.getDefaultIntro();

        const sections = Sections.getSections();
        const sectionLinks = [];
        for (const name of Object.keys(sections).sort()) {
            const taxa = sections[name];

            // Render the section page.
            new PageSection(this.getSiteGenerator(), name, taxa).render(
                taxaColumns,
            );

            // Render the link.
            const href = "./" + name + ".html";
            sectionLinks.push(
                HTML.getLink(href, name) + " (" + taxa.length + ")",
            );
        }
        html += HTML.wrap("ul", HTML.arrayToLI(sectionLinks), {
            class: "listmenu",
        });

        html += "<table>";
        html += "<thead>";
        html += HTML.textElement("th", "Family");
        html += HTML.textElement("th", "Number of Species", { class: "right" });
        html += "</thead>";

        html += "<tbody>";
        for (const family of this.#families) {
            const taxa = family.getTaxa();
            if (!taxa) {
                continue;
            }
            let cols = HTML.wrap(
                "td",
                HTML.getLink("./" + family.getFileName(), family.getName()),
            );
            cols += HTML.wrap("td", taxa.length, { class: "right" });
            html += HTML.wrap("tr", cols);
        }
        html += "</tbody>";

        html += "</table>";

        this.writeFile(html);
    }

    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {import("../types.js").TaxaColDef[]} [taxaColumns]
     */
    renderPages(siteGenerator, taxaColumns) {
        for (const family of this.#families) {
            if (family.getTaxa()) {
                new PageFamily(siteGenerator, family).render(taxaColumns);
            }
        }
    }
}

class PageFamily extends GenericPage {
    #family;

    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {import("../types.js").Family} family
     */
    constructor(siteGenerator, family) {
        super(siteGenerator, family.getName(), family.getBaseFileName());
        this.#family = family;
    }

    /**
     * @param {import("../types.js").TaxaColDef[]} [columns]
     */
    render(columns) {
        let html = this.getDefaultIntro();

        const jepsonLink = ExternalSites.getJepsonRefLink(this.#family);
        if (jepsonLink) {
            html += HTML.wrap(
                "div",
                HTML.getLink(jepsonLink, "Jepson eFlora", {}, true),
                {
                    class: "section",
                },
            );
        }

        const taxa = this.#family.getTaxa();
        if (!taxa) {
            throw new Error();
        }
        html += HTMLTaxon.getTaxaTable(taxa, columns);

        this.writeFile(html);
    }
}

class PageSection extends GenericPage {
    #taxa;

    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {string} name
     * @param {import("../types.js").Taxon[]} taxa
     */
    constructor(siteGenerator, name, taxa) {
        super(siteGenerator, name, name);
        this.#taxa = taxa;
    }

    /**
     * @param {import("../types.js").TaxaColDef[]} [columns]
     */
    render(columns) {
        let html = this.getDefaultIntro();

        html += HTMLTaxon.getTaxaTable(this.#taxa, columns);

        this.writeFile(html);
    }
}
