import { Config } from "./config.js";
import { Genera } from "./genera.js";
import { HTML, HTML_OPTIONS } from "./html.js";
import { RarePlants } from "./rareplants.js";

class Taxon {

    #name;
    #genus;
    #commonNames;
    #status;
    #jepsonID;
    #calRecNum;
    #cfSyn;
    #iNatID;
    #iNatSyn;
    #rpiID;
    #rankRPI;
    #cesa;
    #synonyms = [];

    constructor( name, commonNames, status, jepsonID, calRecNum, iNatID, rpiID, rankRPI, cesa ) {
        this.#name = name;
        this.#genus = name.split( " " )[ 0 ];
        this.#commonNames = commonNames ? commonNames.split( "," ).map( t => t.trim() ) : [];
        this.#status = status;
        this.#jepsonID = jepsonID;
        this.#calRecNum = calRecNum;
        this.#iNatID = iNatID;
        this.#rpiID = rpiID;
        this.#rankRPI = rankRPI;
        this.#cesa = cesa;
        Genera.addTaxon( this );
    }

    addSynonym( syn, type ) {
        this.#synonyms.push( syn );
        switch ( type ) {
            case "CF":
                // Synonym is in Calflora format.
                this.#cfSyn = syn;
                break;
            case "INAT":
                // Synonyms should be in Jepson format, but store iNatName in iNat format (no var or subsp, space after x).
                this.#iNatSyn = syn;
                break;
        }
    }

    getCalfloraName() {
        if ( this.#cfSyn ) {
            return this.#cfSyn;
        }
        return this.getName().replace( " subsp.", " ssp." ).replace( "×", "X" );
    }

    getCalfloraID() {
        return this.#calRecNum;
    }

    getCalfloraTaxonLink() {
        const calfloraID = this.getCalfloraID();
        if ( !calfloraID ) {
            return;
        }
        return HTML.getLink(
            "https://www.calflora.org/app/taxon?crn=" + calfloraID,
            "Calflora",
            {},
            HTML_OPTIONS.OPEN_NEW
        );
    }

    getCESA() {
        return this.#cesa;
    }

    getCommonNames() {
        return this.#commonNames;
    }

    getFamily() {
        return Genera.getFamily( this.#genus );
    }

    getFileName( ext ) {
        return Taxon.getFileName( this.getName(), ext );
    }

    static getFileName( name, ext = "html" ) {
        // Convert spaces to "-" and remove ".".
        return name.replaceAll( " ", "-" ).replaceAll( ".", "" ) + "." + ext;
    }

    getGenus() {
        return Genera.getGenus( this.#genus );
    }

    getGenusName() {
        return this.#genus;
    }

    getHTMLLink( href = true, includeRPI = true ) {
        href = href ? ( "./" + this.getFileName() ) : undefined;
        let className = this.isNative() ? "native" : "non-native";
        if ( includeRPI && this.isRare() ) {
            className = "rare";
        }
        const attributes = { class: className };
        if ( className === "rare" ) {
            this.getRPIRankAndThreatTooltip( attributes );
        }
        return HTML.wrap( "span", HTML.getLink( href, this.getName() ), attributes );
    }

    getINatID() {
        return this.#iNatID;
    }

    getINatName() {
        const name = this.#iNatSyn ? this.#iNatSyn : this.getName();
        return name.replace( / (subsp|var)\./, "" ).replace( "×", "× " );
    }

    getINatTaxonLink() {
        const iNatID = this.getINatID();
        if ( !iNatID ) {
            return "";
        }
        const link = HTML.getLink( "https://www.inaturalist.org/taxa/" + iNatID, "iNaturalist", {}, HTML_OPTIONS.OPEN_NEW );
        return this.#iNatSyn ? ( link + " (" + this.#iNatSyn + ")" ) : link;
    }

    getJepsonID() {
        return this.#jepsonID;
    }

    getName() {
        return this.#name;
    }

    getRPIID() {
        return this.#rpiID;
    }

    getRPIRank() {
        if ( !this.#rankRPI ) {
            return this.#rankRPI;
        }
        return this.#rankRPI.split( "." )[ 0 ];
    }

    getRPIRankAndThreat() {
        return this.#rankRPI;
    }

    getRPIRankAndThreatTooltip( attributes ) {
        attributes[ "title" ] = RarePlants.getRPIRankAndThreatDescriptions( this.getRPIRankAndThreat() ).join( "\n" );
        return attributes;
    }

    getRPITaxonLink() {
        const rpiID = this.getRPIID();
        if ( !rpiID ) {
            return "";
        }
        const link = HTML.getLink( "https://rareplants.cnps.org/Plants/Details/" + rpiID, "CNPS Rare Plant Inventory", {}, HTML_OPTIONS.OPEN_NEW );
        return link;
    }

    getStatus() {
        return this.#status;
    }

    getStatusDescription() {
        switch ( this.#status ) {
            case "N":
                return "Native";
            case "NC":
                return Config.getLabel( "status-NC", "Introduced" );
            case "X":
                return "Introduced";
        }
        throw new Error( this.#status );
    }

    getSynonyms() {
        return this.#synonyms;
    }

    isCANative() {
        return this.#status === "N" || this.#status === "NC";
    }

    isNative() {
        return this.#status === "N";
    }

    isRare() {
        return this.getRPIRank() !== undefined;
    }

}

export { Taxon };