import * as fs from "node:fs";
import { Families } from "./families.js";
import { HTML } from "./html.js";
import { Taxa } from "./taxa.js";
import { HTMLPage } from "./htmlpage.js";
import { PageTaxon } from "./pagetaxon.js";
import { Config } from "./config.js";

class PageRenderer {

    static render( packageDir, outputDir ) {

        // Copy static files
        fs.rmSync( outputDir, { force: true, recursive: true } );
        // First copy default Jekyll files from package.
        fs.cpSync( packageDir + "/jekyll", outputDir, { recursive: true } );
        // Then copy Jekyll files from current dir (which may override default files).
        fs.cpSync( "jekyll", outputDir, { recursive: true } );

        this.renderLists( outputDir );
        this.renderTools( outputDir );

        Families.renderPages( outputDir );

        const taxa = Taxa.getTaxa();
        for ( const taxon of taxa ) {
            new PageTaxon( taxon ).render( outputDir );
        }

    }

    static renderLists( outputDir ) {

        const listInfo = [
            { name: Config.getLabel( "native", "Native" ), filename: "list_native", include: ( t ) => t.isNative() },
            { name: Config.getLabel( "introduced", "Introduced" ), filename: "list_introduced", include: ( t ) => !t.isNative() },
            { name: "All Plants", filename: "list_all", include: () => true },
        ];

        const listsHTML = [];
        for ( const list of listInfo ) {
            const taxa = [];
            const calfloraTaxa = [];
            const iNatTaxa = [];
            for ( const taxon of Taxa.getTaxa() ) {
                if ( list.include( taxon ) ) {
                    taxa.push( taxon );
                    calfloraTaxa.push( taxon.getCalfloraName() );
                    iNatTaxa.push( taxon.getINatName() );
                }
            }

            fs.writeFileSync( outputDir + "/calflora_" + list.filename + ".txt", calfloraTaxa.join( "\n" ) );
            fs.writeFileSync( outputDir + "/inat_" + list.filename + ".txt", iNatTaxa.join( "\n" ) );

            new PageTaxonList().render( outputDir, taxa, list.filename, list.name );
            listsHTML.push( HTML.getLink( "./" + list.filename + ".html", list.name ) + " (" + taxa.length + ")" );
        }

        // Write lists to includes directory so it can be inserted into pages.
        fs.writeFileSync( outputDir + "/_includes/plantlists.html", "<ul>" + HTML.arrayToLI( listsHTML ) + "</ul>" );

    }

    static renderTools( outputDir ) {

        const commonNames = [];
        for ( const taxon of Taxa.getTaxa() ) {
            for ( const commonName of taxon.getCommonNames() ) {
                commonNames.push( [ commonName, taxon.getName() ] );
            }
        }

        const cnObj = {};
        for ( const commonName of commonNames.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) ) ) {
            const normalizedName = commonName[ 0 ].toLowerCase().replaceAll( "-", " " ).replaceAll( "'", "" );
            let data = cnObj[ normalizedName ];
            if ( !data ) {
                data = { cn: commonName[ 0 ], names: [] };
                cnObj[ normalizedName ] = data;
            }
            data.names.push( commonName[ 1 ] );
        }
        fs.writeFileSync( outputDir + "/_includes/common_names.json", JSON.stringify( cnObj ) );


    }

}

class PageTaxonList extends HTMLPage {

    render( outputDir, taxa, baseName, title ) {

        let html = this.getFrontMatter( title );

        html += HTML.getElement( "h1", title );

        html += "<div class=\"wrapper\">";

        html += "<div class=\"section\">";
        html += Taxa.getHTMLTable( taxa );
        html += "</div>";

        html += "<div class=\"section\">";
        html += HTML.getElement( "h2", "Download" );
        html += "<ul>";
        html += "<li>" + HTML.getLink( "./calflora_" + baseName + ".txt", "Calflora List" ) + "</li>";
        html += "<li>" + HTML.getLink( "./inat_" + baseName + ".txt", "iNaturalist List" ) + "</li>";
        html += "</ul>";
        html += "</div>";

        html += "</div>";

        this.writeFile( outputDir, baseName + ".html", html );

    }
}

export { PageRenderer };