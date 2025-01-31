import { GenericPage } from "./genericpage.js";
import { HTML } from "./html.js";
import { Jepson } from "./jepson.js";
import { Files } from "./files.js";
import { Config } from "./config.js";
import { HTMLTaxon } from "./htmltaxon.js";

export class Family {
    #name;
    #data;

    /**
     * @param {string} name
     * @param {*} data
     */
    constructor(name, data) {
        this.#name = name;
        this.#data = data;
    }

    /**
     * @param {import("./taxon.js").Taxon} taxon
     */
    addTaxon(taxon) {
        if (!this.#data.taxa) {
            this.#data.taxa = [];
        }
        this.#data.taxa.push(taxon);
        Sections.addTaxon(this.getSectionName(), taxon);
    }

    getBaseFileName() {
        return this.getName();
    }

    getFileName(ext = "html") {
        return this.getBaseFileName() + "." + ext;
    }

    getJepsonID() {
        return this.#data.id;
    }

    getName() {
        return this.#name;
    }

    getSectionName() {
        return this.#data.section;
    }

    getTaxa() {
        return this.#data.taxa;
    }
}

class Families {
    #families;

    constructor() {
        const dataDir = Config.getPackageDir() + "/data";

        this.#families = JSON.parse(Files.read(dataDir + "/families.json"));
        for (const [k, v] of Object.entries(this.#families)) {
            this.#families[k] = new Family(k, v);
        }
    }

    getFamilies() {
        return Object.values(this.#families).sort((a, b) =>
            a.getName().localeCompare(b.getName()),
        );
    }

    /**
     * @param {string} familyName
     */
    getFamily(familyName) {
        return this.#families[familyName];
    }

    /**
     * @param {string} outputDir
     * @param {import("./htmltaxon.js").TaxaColDef[]} [taxaColumns]
     */
    renderPages(outputDir, taxaColumns) {
        new PageFamilyList(outputDir, this.#families).render(taxaColumns);

        const names = Object.keys(this.#families);
        for (const name of names.sort()) {
            const family = this.#families[name];
            if (family.getTaxa()) {
                new PageFamily(outputDir, family).render(taxaColumns);
            }
        }
    }
}

class PageFamilyList extends GenericPage {
    #families;

    /**
     * @param {string} outputDir
     * @param {Object<string,Family>} families
     */
    constructor(outputDir, families) {
        super(outputDir, "Families", "list_families");
        this.#families = families;
    }

    /**
     * @param {import("./htmltaxon.js").TaxaColDef[]} [taxaColumns]
     */
    render(taxaColumns) {
        let html = this.getDefaultIntro();

        const sections = Sections.getSections();
        const sectionLinks = [];
        for (const name of Object.keys(sections).sort()) {
            const taxa = sections[name];

            // Render the section page.
            new PageSection(this.getOutputDir(), name, taxa).render(
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
        const names = Object.keys(this.#families).sort();
        for (const name of names) {
            const family = this.#families[name];
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
}

class PageFamily extends GenericPage {
    #family;

    /**
     * @param {string} outputDir
     * @param {Family} family
     */
    constructor(outputDir, family) {
        super(outputDir, family.getName(), family.getBaseFileName());
        this.#family = family;
    }

    /**
     * @param {import("./htmltaxon.js").TaxaColDef[]} [columns]
     */
    render(columns) {
        let html = this.getDefaultIntro();

        html += HTML.wrap(
            "div",
            Jepson.getEFloraLink(this.#family.getJepsonID()),
            { class: "section" },
        );

        html += HTMLTaxon.getTaxaTable(this.#family.getTaxa(), columns);

        this.writeFile(html);
    }
}

class PageSection extends GenericPage {
    #taxa;

    /**
     * @param {string} outputDir
     * @param {string} name
     * @param {import("./taxon.js").Taxon[]} taxa
     */
    constructor(outputDir, name, taxa) {
        super(outputDir, name, name);
        this.#taxa = taxa;
    }

    /**
     * @param {import("./htmltaxon.js").TaxaColDef[]} [columns]
     */
    render(columns) {
        let html = this.getDefaultIntro();

        html += HTMLTaxon.getTaxaTable(this.#taxa, columns);

        this.writeFile(html);
    }
}

class Sections {
    /** @type {Object<string,import("./taxon.js").Taxon[]>} */
    static #sections = {};

    /**
     * @param {string} name
     * @param {import("./taxon.js").Taxon} taxon
     */
    static addTaxon(name, taxon) {
        let section = this.#sections[name];
        if (!section) {
            section = [];
            this.#sections[name] = section;
        }
        section.push(taxon);
    }

    static getSections() {
        return this.#sections;
    }
}

export { Families };
