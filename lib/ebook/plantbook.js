import { Families, Taxa } from "@ca-plant-list/ca-plant-list";
import { EBook } from "./ebook.js";
import { GlossaryPages } from "./glossarypages.js";
import { Images } from "./images.js";
import { PageListFamilies } from "./pages/page_list_families.js";
import { PageListFlowerColor } from "./pages/page_list_flower_color.js";
import { PageListSpecies } from "./pages/page_list_species.js";
import { TaxonPage } from "./pages/taxonpage.js";
import { TOCPage } from "./pages/tocpage.js";
import { Config } from "../config.js";
import { FLOWER_COLOR_NAMES } from "../taxa.js";

class PlantBook extends EBook {

    #glossary;
    #images;

    constructor() {

        super(
            "output",
            Config.getConfigValue( "ebook", "filename" ),
            Config.getConfigValue( "ebook", "pub_id" ),
            Config.getConfigValue( "ebook", "title" )
        );

        this.#glossary = new GlossaryPages();
        this.#images = new Images( this.getContentDir() );

    }

    async createPages() {

        const contentDir = this.getContentDir();

        console.log( "creating taxon pages" );
        const taxa = Taxa.getTaxa();
        for ( const taxon of taxa ) {
            const name = taxon.getName();
            new TaxonPage( contentDir, taxon, this.#images[ name ] ).create();
        }

        // Create lists.
        for ( const colorName of FLOWER_COLOR_NAMES ) {
            new PageListFlowerColor( contentDir, Taxa.getFlowerColor( colorName ) ).create();
        }
        new PageListFamilies( contentDir ).create();
        for ( const family of Families.getFamilies() ) {
            const taxa = family.getTaxa();
            if ( !taxa ) {
                continue;
            }
            const name = family.getName();
            new PageListSpecies( contentDir, taxa, name + ".html", name ).create();
        }
        new PageListSpecies( contentDir, taxa, "list_species.html", "All Species" ).create();

        await this.#images.createImages( contentDir );
        this.#glossary.createPages( contentDir );

        new TOCPage( contentDir ).create();
    }

    renderManifestEntries() {

        let xml = "";

        // Add lists.
        xml += "<item id=\"lspecies\" href=\"list_species.html\" media-type=\"application/xhtml+xml\" />";
        xml += "<item id=\"lfamilies\" href=\"list_families.html\" media-type=\"application/xhtml+xml\" />";
        for ( const colorName of FLOWER_COLOR_NAMES ) {
            const color = Taxa.getFlowerColor( colorName );
            xml += "<item id=\"l" + color.getColorName() + "\" href=\"" + color.getFileName() + "\" media-type=\"application/xhtml+xml\" />";
        }

        // Add family pages.
        for ( const family of Families.getFamilies() ) {
            const taxa = family.getTaxa();
            if ( !taxa ) {
                continue;
            }
            xml += "<item id=\"fam" + family.getName() + "\" href=\"" + family.getFileName() + "\" media-type=\"application/xhtml+xml\" />";
        }

        // Add taxon pages.
        const taxa = Taxa.getTaxa();
        for ( let index = 0; index < taxa.length; index++ ) {
            const taxon = taxa[ index ];
            xml += "<item id=\"t" + index + "\" href=\"" + taxon.getFileName() + "\" media-type=\"application/xhtml+xml\" />";
        }

        xml += this.#glossary.getManifestEntries();
        xml += this.#images.getManifestEntries();

        return xml;
    }

    renderSpineElements() {
        let xml = "";

        // Add lists.
        for ( const colorName of FLOWER_COLOR_NAMES ) {
            const color = Taxa.getFlowerColor( colorName );
            xml += "<itemref idref=\"l" + color.getColorName() + "\"/>";
        }
        xml += "<itemref idref=\"lfamilies\"/>";
        xml += "<itemref idref=\"lspecies\"/>";

        // Add families.
        for ( const family of Families.getFamilies() ) {
            const taxa = family.getTaxa();
            if ( !taxa ) {
                continue;
            }
            xml += "<itemref idref=\"fam" + family.getName() + "\"/>";
        }

        // Add taxa.
        for ( let index = 0; index < Taxa.getTaxa().length; index++ ) {
            xml += "<itemref idref=\"t" + index + "\"/>";
        }

        xml += this.#glossary.getSpineEntries();

        return xml;
    }
}

export { PlantBook };