import { HTML } from "./html.js";
import { Jepson } from "./jepson.js";
import { Config } from "./config.js";
import { RarePlants } from "./rareplants.js";
import { GenericPage } from "./genericpage.js";
import { Files } from "./files.js";

class PageTaxon extends GenericPage {

    #taxon;

    constructor( outputDir, taxon ) {
        super( outputDir, taxon.getName(), taxon.getBaseFileName() );
        this.#taxon = taxon;
    }

    #getInfoLinks() {
        const links = [];
        const jepsonID = this.#taxon.getJepsonID();
        if ( jepsonID ) {
            links.push( Jepson.getEFloraLink( jepsonID ) );
        }
        const cfLink = this.#taxon.getCalfloraTaxonLink();
        if ( cfLink ) {
            links.push( cfLink );
        }
        const iNatLink = this.#taxon.getINatTaxonLink();
        if ( iNatLink ) {
            links.push( iNatLink );
        }
        const rpiLink = this.#taxon.getRPITaxonLink();
        if ( rpiLink ) {
            links.push( rpiLink );
        }
        return links;
    }

    #getObsLinks() {
        const links = [];
        links.push(
            HTML.getLink(
                "https://www.calflora.org/entry/observ.html?track=m#srch=t&grezc=5&cols=b&lpcli=t&cc="
                + Config.getCountyCodes().join( "!" ) + "&incobs=f&taxon="
                + this.#taxon.getCalfloraName().replaceAll( " ", "+" ),
                "Calflora",
                {},
                true
            )
        );
        const iNatID = this.#taxon.getINatID();
        if ( iNatID ) {
            links.push(
                HTML.getLink(
                    "https://www.inaturalist.org/observations?project_id=" + Config.getConfigValue( "inat", "project" )
                    + "&quality_grade=research&subview=map&taxon_id=" + iNatID,
                    "iNaturalist",
                    {},
                    true
                )
            );
        }

        return links;
    }

    #getListSectionHTML( list, header, className ) {
        let html = "";
        if ( list.length > 0 ) {
            html += "<div class=\"section " + className + "\">";
            html += HTML.textElement( "h2", header );
            html += "<ul>";
            html += HTML.arrayToLI( list );
            html += "</ul>";
            html += "</div>";
        }
        return html;
    }

    #getRarityInfo() {
        const cnpsRank = this.#taxon.getRPIRankAndThreat();
        if ( !cnpsRank ) {
            return "";
        }
        const ranks = [];

        ranks.push( HTML.textElement( "span", "CNPS Rare Plant Rank:", { class: "label" } )
            + HTML.getToolTip( cnpsRank, this.#taxon.getRPIRankAndThreatTooltip() ) );
        if ( this.#taxon.getCESA() ) {
            ranks.push( HTML.textElement( "span", "CESA:", { class: "label" } ) + RarePlants.getCESADescription( this.#taxon.getCESA() ) );
        }

        return HTML.wrap(
            "div",
            "<ul>" + HTML.arrayToLI( ranks ) + "</ul>",
            { class: "section" }
        );
    }

    #getRelatedTaxaLinks() {
        const links = [];
        const genus = this.#taxon.getGenus();
        if ( genus ) {
            const taxa = genus.getTaxa();
            if ( taxa.length > 1 ) {
                for ( const taxon of taxa ) {
                    links.push( taxon.getHTMLLink( taxon.getName() !== this.#taxon.getName() ) );
                }
            }
        }
        return links;
    }

    #getSynonyms() {
        return this.#taxon.getSynonyms();
    }

    render() {

        let html = this.getDefaultIntro();

        html += "<div class=\"wrapper\">";

        const cn = this.#taxon.getCommonNames();
        if ( cn.length > 0 ) {
            html += HTML.textElement( "div", cn.join( ", " ), { class: "section common-names" } );
        }

        html += HTML.textElement( "div", this.#taxon.getStatusDescription(), { class: "section native-status" } );

        const family = this.#taxon.getFamily();
        html += HTML.wrap(
            "div",
            HTML.textElement( "span", "Family:", { class: "label" } ) + HTML.getLink( "./" + family.getFileName(), family.getName() ),
            { class: "section" }
        );

        html += this.#getRarityInfo();

        html += "</div>";

        const introName = "intros/" + this.#taxon.getFileName( "md" );
        if ( Files.exists( "./jekyll/_includes/" + introName ) ) {
            html += HTML.wrap(
                "div",
                "{% capture my_include %}{% include " + introName + "%}{% endcapture %}{{ my_include | markdownify }}",
                { class: "section" }
            );
        }

        html += "<div class=\"grid\">";
        html += this.#getListSectionHTML( this.#getInfoLinks(), "Information", "info" );
        html += this.#getListSectionHTML( this.#getObsLinks(), "Observations", "obs" );
        html += this.#getListSectionHTML( this.#getRelatedTaxaLinks(), "Related Species", "rel-taxa" );
        html += this.#getListSectionHTML( this.#getSynonyms(), "Synonyms", "synonyms" );
        html += "</div>";

        this.writeFile( html );

    }

}

export { PageTaxon };