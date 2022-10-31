import * as fs from "node:fs";
import { Families } from "./families.js";
import { HTML, HTML_OPTIONS } from "./html.js";
import { Taxa } from "./taxa.js";
import { HTMLPage } from "./htmlpage.js";
import { PageTaxon } from "./pagetaxon.js";
import { Config } from "./config.js";
import { RarePlants } from "./rareplants.js";

class PageRenderer {

    static render( outputDir ) {

        // Copy static files
        fs.rmSync( outputDir, { force: true, recursive: true } );
        // First copy default Jekyll files from package.
        fs.cpSync( Config.getPackageDir() + "/jekyll", outputDir, { recursive: true } );
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

        function getListArray( listInfo, attributes = {} ) {
            const listArray = [];
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

                if ( taxa.length === 0 ) {
                    continue;
                }

                fs.writeFileSync( outputDir + "/calflora_" + list.filename + ".txt", calfloraTaxa.join( "\n" ) );
                fs.writeFileSync( outputDir + "/inat_" + list.filename + ".txt", iNatTaxa.join( "\n" ) );

                new PageTaxonList().render( outputDir, taxa, list.filename, list.name );

                // Check for sublists.
                const subListHTML = list.listInfo ? getListArray( list.listInfo, { class: "indent" } ) : "";

                listArray.push( HTML.getLink( "./" + list.filename + ".html", list.name ) + " (" + taxa.length + ")" + subListHTML );
            }
            return renderList( listArray, attributes );
        }

        function renderList( listsHTML, attributes = {} ) {
            return HTML.getElement( "ul", HTML.arrayToLI( listsHTML ), attributes, HTML_OPTIONS.NO_ESCAPE );
        }

        function renderSection( title, listsHTML ) {
            let html = "<div class=\"section\">";
            html += HTML.getElement( "h2", title );
            html += listsHTML;
            html += "</div>";
            return html;
        }

        const sections = [
            {
                title: "All Species",
                listInfo: [
                    { name: Config.getLabel( "native", "Native" ), filename: "list_native", include: ( t ) => t.isNative() },
                    { name: Config.getLabel( "introduced", "Introduced" ), filename: "list_introduced", include: ( t ) => !t.isNative() },
                    { name: "All Plants", filename: "list_all", include: () => true },
                ]
            },
            {
                title: "Rare Plants",
                listInfo: [
                    {
                        name: "CNPS Ranked Plants",
                        filename: "list_rpi",
                        include: ( t ) => t.getRPIRank() !== undefined,
                        listInfo: [
                            {
                                name: RarePlants.getRPIRankDescription( "1A" ),
                                filename: "list_rpi_1a",
                                include: ( t ) => t.getRPIRank() === "1A",
                            },
                            {
                                name: RarePlants.getRPIRankDescription( "1B" ),
                                filename: "list_rpi_1b",
                                include: ( t ) => t.getRPIRank() === "1B",
                            },
                            {
                                name: RarePlants.getRPIRankDescription( "2A" ),
                                filename: "list_rpi_2a",
                                include: ( t ) => t.getRPIRank() === "2A",
                            },
                            {
                                name: RarePlants.getRPIRankDescription( "2B" ),
                                filename: "list_rpi_2b",
                                include: ( t ) => t.getRPIRank() === "2B",
                            },
                            {
                                name: RarePlants.getRPIRankDescription( "3" ),
                                filename: "list_rpi_3",
                                include: ( t ) => t.getRPIRank() === "3",
                            },
                            {
                                name: RarePlants.getRPIRankDescription( "4" ),
                                filename: "list_rpi_4",
                                include: ( t ) => t.getRPIRank() === "4",
                            },
                        ]
                    },
                    {
                        name: "California Endangered Species Act",
                        filename: "list_cesa",
                        include: ( t ) => t.getCESA() !== undefined,
                        listInfo: [
                            {
                                name: RarePlants.getCESADescription( "CE" ),
                                filename: "list_rpi_ce",
                                include: ( t ) => t.getCESA() === "CE",
                            },
                            {
                                name: RarePlants.getCESADescription( "CT" ),
                                filename: "list_rpi_ct",
                                include: ( t ) => t.getCESA() === "CT",
                            },
                            {
                                name: RarePlants.getCESADescription( "CR" ),
                                filename: "list_rpi_cr",
                                include: ( t ) => t.getCESA() === "CR",
                            },
                            {
                                name: RarePlants.getCESADescription( "CC" ),
                                filename: "list_rpi_cc",
                                include: ( t ) => t.getCESA() === "CC",
                            },
                        ]
                    },
                ]
            },
        ];

        let html = "<div class=\"wrapper\">";
        for ( const section of sections ) {

            const listHTML = getListArray( section.listInfo );

            if ( listHTML.length > 0 ) {
                html += renderSection( section.title, listHTML );
            }

        }
        html += renderSection( "Taxonomy", renderList( [ HTML.getLink( "./list_families.html", "Plant Families" ) ] ) );

        html += "</div>";

        // Write lists to includes directory so it can be inserted into pages.
        fs.writeFileSync( outputDir + "/_includes/plantlists.html", html );

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