import { ProgressMeter } from "../progressmeter.js";
import { EBook } from "./ebook.js";
import { EBookSiteGenerator } from "./ebooksitegenerator.js";
import { GlossaryPages } from "./glossarypages.js";
import { Images } from "./images.js";
import { PageListFamilies } from "./pages/pageListFamilies.js";
import { PageListFlowerColor } from "./pages/page_list_flower_color.js";
import { PageListFlowers } from "./pages/pageListFlowers.js";
import { PageListSpecies } from "./pages/page_list_species.js";
import { TaxonPage } from "./pages/taxonpage.js";
import { TOCPage } from "./pages/tocpage.js";

class PlantBook extends EBook {
    #taxa;
    #glossary;
    #images;

    /**
     * @param {string} outputDir
     * @param {import("../config.js").Config} config
     * @param {import("../types.js").Taxa} taxa
     */
    constructor(outputDir, config, taxa) {
        super(
            outputDir,
            getRequiredConfigValue(config, "filename"),
            getRequiredConfigValue(config, "pub_id"),
            getRequiredConfigValue(config, "title"),
        );

        this.#taxa = taxa;
        const generator = new EBookSiteGenerator(config, this.getContentDir());
        this.#glossary = new GlossaryPages(generator);
        this.#images = new Images(generator, this.getContentDir(), taxa);
    }

    async createPages() {
        const contentDir = this.getContentDir();

        const taxonList = this.#taxa.getTaxonList();

        await this.#images.createImages(taxonList);

        const meter = new ProgressMeter(
            "creating taxon pages",
            taxonList.length,
        );
        for (let index = 0; index < taxonList.length; index++) {
            const taxon = taxonList[index];
            new TaxonPage(contentDir, taxon, this.#images).create();
            meter.update(index + 1);
        }
        meter.stop();

        // Create lists.
        for (const color of this.#taxa.getFlowerColors()) {
            new PageListFlowerColor(contentDir, color).create();
        }

        PageListFlowers.createPages(contentDir, this.#taxa);

        new PageListFamilies(contentDir, this.#taxa.getFamilies()).create();
        for (const family of this.#taxa.getFamilies().getFamilies()) {
            const taxa = family.getTaxa();
            if (!taxa) {
                continue;
            }
            const name = family.getName();
            new PageListSpecies(
                contentDir,
                taxa,
                name + ".html",
                name,
            ).create();
        }
        new PageListSpecies(
            contentDir,
            taxonList,
            "list_species.html",
            "All Species",
        ).create();

        this.#glossary.renderPages();

        new TOCPage(contentDir, this.#taxa).create();
    }

    renderManifestEntries() {
        let xml = "";

        // Add lists.
        xml +=
            '<item id="lspecies" href="list_species.html" media-type="application/xhtml+xml" />';
        xml +=
            '<item id="lfamilies" href="list_families.html" media-type="application/xhtml+xml" />';
        for (const color of this.#taxa.getFlowerColors()) {
            xml +=
                '<item id="l' +
                color.getColorName() +
                '" href="' +
                color.getFileName() +
                '" media-type="application/xhtml+xml" />';
        }

        // Add family pages.
        for (const family of this.#taxa.getFamilies().getFamilies()) {
            const taxa = family.getTaxa();
            if (!taxa) {
                continue;
            }
            xml +=
                '<item id="fam' +
                family.getName() +
                '" href="' +
                family.getFileName() +
                '" media-type="application/xhtml+xml" />';
        }

        // Add taxon pages.
        const taxa = this.#taxa.getTaxonList();
        for (let index = 0; index < taxa.length; index++) {
            const taxon = taxa[index];
            xml +=
                '<item id="t' +
                index +
                '" href="' +
                taxon.getFileName() +
                '" media-type="application/xhtml+xml" />';
        }

        xml += PageListFlowers.getManifestEntries();
        xml += this.#glossary.getManifestEntries();
        xml += this.#images.getManifestEntries();

        return xml;
    }

    renderSpineElements() {
        let xml = "";

        // Add lists.
        for (const color of this.#taxa.getFlowerColors()) {
            xml += '<itemref idref="l' + color.getColorName() + '"/>';
        }
        xml += PageListFlowers.getSpineEntries();

        xml += '<itemref idref="lfamilies"/>';
        xml += '<itemref idref="lspecies"/>';

        // Add families.
        for (const family of this.#taxa.getFamilies().getFamilies()) {
            const taxa = family.getTaxa();
            if (!taxa) {
                continue;
            }
            xml += '<itemref idref="fam' + family.getName() + '"/>';
        }

        // Add taxa.
        for (let index = 0; index < this.#taxa.getTaxonList().length; index++) {
            xml += '<itemref idref="t' + index + '"/>';
        }

        xml += this.#glossary.getSpineEntries();

        return xml;
    }
}

/**
 * @param {import("../config.js").Config} config
 * @param {string} name
 * @returns {string}
 */
function getRequiredConfigValue(config, name) {
    const value = config.getConfigValue("ebook", name);
    if (value === undefined) {
        throw new Error(`Failed to find ebook config for ${name}`);
    }
    return value;
}

export { PlantBook };
