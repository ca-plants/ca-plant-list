import { EBook } from "./ebook.js";
import { EBookSiteGenerator } from "./ebooksitegenerator.js";
import { GlossaryPages } from "./glossarypages.js";
import { Images } from "./images.js";
import { PageListFamilies } from "./pages/page_list_families.js";
import { PageListFlowerColor } from "./pages/page_list_flower_color.js";
import { PageListFlowers } from "./pages/page_list_flowers.js";
import { PageListSpecies } from "./pages/page_list_species.js";
import { TaxonPage } from "./pages/taxonpage.js";
import { TOCPage } from "./pages/tocpage.js";

class PlantBook extends EBook {
    #taxa;
    #glossary;
    #images;

    /**
     *
     * @param {string} outputDir
     * @param {*} config
     * @param {Taxa} taxa
     */
    constructor(outputDir, config, taxa) {
        super(
            outputDir,
            config.getConfigValue("ebook", "filename"),
            config.getConfigValue("ebook", "pub_id"),
            config.getConfigValue("ebook", "title")
        );

        this.#taxa = taxa;
        const generator = new EBookSiteGenerator(this.getContentDir());
        this.#glossary = new GlossaryPages(generator);
        this.#images = new Images(generator, this.getContentDir(), taxa);
    }

    async createPages() {
        const contentDir = this.getContentDir();

        await this.#images.createImages();

        console.log("creating taxon pages");
        const taxonList = this.#taxa.getTaxonList();
        for (const taxon of taxonList) {
            const name = taxon.getName();
            new TaxonPage(
                contentDir,
                taxon,
                this.#images.getTaxonImages(name)
            ).create();
        }

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
                name
            ).create();
        }
        new PageListSpecies(
            contentDir,
            taxonList,
            "list_species.html",
            "All Species"
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

export { PlantBook };
