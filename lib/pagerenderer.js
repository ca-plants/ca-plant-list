import { Files, Taxa, HTML } from "@ca-plant-list/ca-plant-list";
import { TAXA_LIST_COLS } from "./taxa.js";
import { PageTaxon } from "./web/pagetaxon.js";
import { RarePlants } from "./rareplants.js";
import { BasePageRenderer } from "./basepagerenderer.js";
import { GenericPage } from "./genericpage.js";

const ENDANGERED_COLS = [ TAXA_LIST_COLS.SPECIES, TAXA_LIST_COLS.COMMON_NAME, TAXA_LIST_COLS.CESA, TAXA_LIST_COLS.FESA ];
const RPI_COLUMNS = [ TAXA_LIST_COLS.SPECIES_BARE, TAXA_LIST_COLS.COMMON_NAME, TAXA_LIST_COLS.CNPS_RANK ];

class PageRenderer extends BasePageRenderer {

    static render( outputDir, config, taxa ) {

        super.render( outputDir, taxa );

        this.renderLists( outputDir, config, taxa );

        const taxonList = taxa.getTaxonList();
        for ( const taxon of taxonList ) {
            new PageTaxon( outputDir, config, taxon ).render();
        }

    }

    static renderLists( outputDir, config, taxa ) {

        function getListArray( listInfo, attributes = {}, columns ) {

            const listArray = [];
            for ( const list of listInfo ) {
                const listTaxa = [];
                const calfloraTaxa = [];
                const iNatTaxa = [];
                for ( const taxon of taxa.getTaxa() ) {
                    if ( list.include( taxon ) ) {
                        listTaxa.push( taxon );
                        calfloraTaxa.push( taxon.getCalfloraName() );
                        iNatTaxa.push( taxon.getINatName() );
                    }
                }

                if ( listTaxa.length === 0 ) {
                    continue;
                }

                Files.write( outputDir + "/calflora_" + list.filename + ".txt", calfloraTaxa.join( "\n" ) );
                Files.write( outputDir + "/inat_" + list.filename + ".txt", iNatTaxa.join( "\n" ) );

                const cols = columns ? columns : list.columns;
                new PageTaxonList( outputDir, list.name, list.filename ).render( listTaxa, cols );

                // Check for sublists.
                const subListHTML = list.listInfo ? getListArray( list.listInfo, { class: "indent" }, cols ) : "";

                listArray.push( HTML.getLink( "./" + list.filename + ".html", list.name ) + " (" + listTaxa.length + ")" + subListHTML );
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
                    { name: config.getLabel( "native", "Native" ), filename: "list_native", include: ( t ) => t.isNative() },
                    { name: config.getLabel( "introduced", "Introduced" ), filename: "list_introduced", include: ( t ) => !t.isNative() },
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
                        name: "Endangered Species",
                        filename: "list_endangered",
                        include: ( t ) => ( t.getCESA() || t.getFESA() ),
                        columns: ENDANGERED_COLS,
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
        Files.write( outputDir + "/_includes/plantlists.html", html );

    }

}

class PageTaxonList extends GenericPage {

    constructor( outputDir, title, baseName ) {
        super( outputDir, title, baseName );
    }

    render( taxa, columns ) {

        let html = this.getDefaultIntro();

        html += "<div class=\"wrapper\">";

        html += "<div class=\"section\">";
        html += Taxa.getHTMLTable( taxa, columns );
        html += "</div>";

        html += "<div class=\"section\">";
        html += HTML.textElement( "h2", "Download" );
        html += "<ul>";
        html += "<li>" + HTML.getLink( "./calflora_" + this.getBaseFileName() + ".txt", "Calflora List" ) + "</li>";
        html += "<li>" + HTML.getLink( "./inat_" + this.getBaseFileName() + ".txt", "iNaturalist List" ) + "</li>";
        html += "</ul>";
        html += "</div>";

        html += "</div>";

        this.writeFile( html );

    }
}

export { PageRenderer };