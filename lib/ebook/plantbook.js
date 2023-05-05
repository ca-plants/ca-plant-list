import * as fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CSV, Families, Files, Taxa } from "@ca-plant-list/ca-plant-list";
import { EBook } from "./ebook.js";
import { Image } from "./image.js";
import { PageListSpecies } from "./pages/page_list_species.js";
import { PageListFlowerColor } from "./pages/page_list_flower_color.js";
import { TaxonPage } from "./pages/taxonpage.js";
import { TOCPage } from "./pages/tocpage.js";
import { Config } from "../config.js";
import { FLOWER_COLOR_NAMES } from "../taxa.js";

class PlantBook extends EBook {

    #images = {};

    constructor() {

        super(
            "output",
            Config.getConfigValue( "ebook", "filename" ),
            Config.getConfigValue( "ebook", "pub_id" ),
            Config.getConfigValue( "ebook", "title" )
        );

        Families.init();

    }

    async createPages() {
        await this.#importImages();

        const contentDir = this.getContentDir();
        const taxa = Taxa.getTaxa();
        for ( const taxon of taxa ) {
            const name = taxon.getName();
            new TaxonPage( contentDir, taxon, this.#images[ name ] ).create();
        }

        // Create lists.
        for ( const colorName of FLOWER_COLOR_NAMES ) {
            new PageListFlowerColor( contentDir, Taxa.getFlowerColor( colorName ) ).create();
        }
        new PageListSpecies( contentDir, taxa ).create();

        new TOCPage( contentDir ).create();
    }

    async #importImages() {

        const photoDirSrc = "external_data/photos";
        const imagePrefix = "i";
        const photoDirTarget = this.getContentDir() + "/" + imagePrefix;
        fs.mkdirSync( photoDirSrc, { recursive: true } );
        fs.mkdirSync( photoDirTarget, { recursive: true } );

        const rows = CSV.parseFile( Config.getPackageDir() + "/data", "photos.csv" );
        for ( const row of rows ) {

            const name = row[ "taxon_name" ];
            const taxon = Taxa.getTaxon( name );
            if ( !taxon ) {
                continue;
            }

            let imageList = this.#images[ name ];
            if ( !imageList ) {
                imageList = [];
                this.#images[ name ] = imageList;
            }

            const src = new URL( row[ "source" ] );
            const parts = path.parse( src.pathname ).dir.split( "/" );
            const prefix = src.host.includes( "calflora" ) ? "cf-" : "inat-";
            const filename = prefix + parts.slice( -1 )[ 0 ] + ".jpg";
            const srcFileName = photoDirSrc + "/" + filename;
            const targetFileName = photoDirTarget + "/" + filename;

            if ( !fs.existsSync( srcFileName ) ) {
                // File is not there; retrieve it.
                console.log( "retrieving " + srcFileName );
                await Files.fetch( src, srcFileName );
            }

            await new sharp( srcFileName ).resize( { width: 400 } ).jpeg( { quality: 40 } ).toFile( targetFileName );

            imageList.push( new Image( imagePrefix + "/" + filename, row[ "credit" ] ) );

        }
    }

    renderManifestEntries() {

        let xml = "";

        xml += "<item id=\"f0\" href=\"i/f-blue.svg\" media-type=\"image/svg+xml\" />";
        xml += "<item id=\"f1\" href=\"i/f-orange.svg\" media-type=\"image/svg+xml\" />";
        xml += "<item id=\"f2\" href=\"i/f-pink.svg\" media-type=\"image/svg+xml\" />";
        xml += "<item id=\"f3\" href=\"i/f-red.svg\" media-type=\"image/svg+xml\" />";
        xml += "<item id=\"f4\" href=\"i/f-white.svg\" media-type=\"image/svg+xml\" />";
        xml += "<item id=\"f5\" href=\"i/f-yellow.svg\" media-type=\"image/svg+xml\" />";

        // Add lists.
        xml += "<item id=\"l0\" href=\"list_species.html\" media-type=\"application/xhtml+xml\" />";
        for ( const colorName of FLOWER_COLOR_NAMES ) {
            const color = Taxa.getFlowerColor( colorName );
            xml += "<item id=\"l" + color.getColorName() + "\" href=\"" + color.getFileName() + "\" media-type=\"application/xhtml+xml\" />";
        }

        // Add taxon pages.
        const taxa = Taxa.getTaxa();
        for ( let index = 0; index < taxa.length; index++ ) {
            const taxon = taxa[ index ];
            xml += "<item id=\"t" + index + "\" href=\"" + taxon.getFileName() + "\" media-type=\"application/xhtml+xml\" />";
        }

        // Add images.
        let index = 0;
        for ( const imageList of Object.values( this.#images ) ) {
            for ( const image of imageList ) {
                xml += "<item id=\"i" + index + "\" href=\"" + image.getSrc() + "\" media-type=\"image/jpeg\" />";
                index++;
            }
        }
        return xml;
    }

    renderSpineElements() {
        let xml = "";

        // Add lists.
        for ( const colorName of FLOWER_COLOR_NAMES ) {
            const color = Taxa.getFlowerColor( colorName );
            xml += "<itemref idref=\"l" + color.getColorName() + "\"/>";
        }
        xml += "<itemref idref=\"l0\"/>";

        for ( let index = 0; index < Taxa.getTaxa().length; index++ ) {
            xml += "<itemref idref=\"t" + index + "\"/>";
        }
        return xml;
    }
}

export { PlantBook };