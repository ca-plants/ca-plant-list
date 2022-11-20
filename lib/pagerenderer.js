import * as fs from "node:fs";
import { HTML } from "./html.js";
import { Taxa, COLUMNS } from "./taxa.js";
import { HTMLPage } from "./htmlpage.js";
import { PageTaxon } from "./pagetaxon.js";
import { Config } from "./config.js";
import { RarePlants } from "./rareplants.js";
import { BasePageRenderer } from "./basepagerenderer.js";

const RPI_COLUMNS = [ COLUMNS.COL_SPECIES, COLUMNS.COL_COMMON_NAME, COLUMNS.COL_CNPS_RANK ];

class PageRenderer extends BasePageRenderer {

    static render( outputDir ) {

        super.render( outputDir, Taxa );

        this.renderLists( outputDir );

        const taxa = Taxa.getTaxa();
        for ( const taxon of taxa ) {
            new PageTaxon( taxon ).render( outputDir );
        }

    }

    static renderLists( outputDir ) {

        function getListArray( listInfo, attributes = {}, columns ) {

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

                const cols = columns ? columns : list.columns;
                new PageTaxonList().render( outputDir, taxa, list.filename, list.name, cols );

                // Check for sublists.
                const subListHTML = list.listInfo ? getListArray( list.listInfo, { class: "indent" }, cols ) : "";

                listArray.push( HTML.getLink( "./" + list.filename + ".html", list.name ) + " (" + taxa.length + ")" + subListHTML );
            }

            return renderList( listArray, attributes );
        }

        function renderList( listsHTML, attributes = {} ) {
            return HTML.wrap( "ul", HTML.arrayToLI( listsHTML ), attributes );
        }

        function renderSection( title, listsHTML ) {
            let html = "<div class=\"section\">";
            html += HTML.textElement( "h2", title );
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
                        columns: RPI_COLUMNS,
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

            const listHTML = getListArray( section.listInfo, section.listInfo.columns );

            if ( listHTML.length > 0 ) {
                html += renderSection( section.title, listHTML );
            }

        }
        html += renderSection( "Taxonomy", renderList( [ HTML.getLink( "./list_families.html", "Plant Families" ) ] ) );

        html += "</div>";

        // Write lists to includes directory so it can be inserted into pages.
        fs.writeFileSync( outputDir + "/_includes/plantlists.html", html );

    }

}

class PageTaxonList extends HTMLPage {

    render( outputDir, taxa, baseName, title, columns ) {

        let html = this.getFrontMatter( title );

        html += HTML.textElement( "h1", title );

        html += "<div class=\"wrapper\">";

        html += "<div class=\"section\">";
        html += Taxa.getHTMLTable( taxa, columns );
        html += "</div>";

        html += "<div class=\"section\">";
        html += HTML.textElement( "h2", "Download" );
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