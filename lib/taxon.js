import { Config } from "./config.js";
import { Genera } from "./genera.js";
import { HTML } from "./html.js";
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
    #fesa;
    #rankCNDDB;
    #rankGlobal;
    #synonyms = [];

    constructor( name, commonNames, status, jepsonID, calRecNum, iNatID, rpiID, rankRPI, cesa, fesa, rankCNDDB, rankGlobal ) {
        this.#name = name;
        this.#genus = name.split( " " )[ 0 ];
        this.#commonNames = commonNames ? commonNames.split( "," ).map( t => t.trim() ) : [];
        this.#status = status;
        this.#jepsonID = jepsonID;
        this.#calRecNum = calRecNum;
        this.#iNatID = iNatID;
        this.#rpiID = rpiID;
        this.#rankRPI = rankRPI;
        this.#cesa = cesa ? cesa : undefined;
        this.#fesa = fesa ? fesa : undefined;
        this.#rankCNDDB = rankCNDDB ? rankCNDDB : undefined;
        this.#rankGlobal = rankGlobal ? rankGlobal : undefined;
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

    getBaseFileName() {
        // Convert spaces to "-" and remove ".".
        return this.#name.replaceAll( " ", "-" ).replaceAll( ".", "" );
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
        const link = HTML.getLink( "https://www.calflora.org/app/taxon?crn=" + calfloraID, "Calflora", {}, true );
        return this.#cfSyn ? ( link + " (" + this.#cfSyn + ")" ) : link;
    }

    getCESA() {
        return this.#cesa;
    }

    getCNDDBRank() {
        return this.#rankCNDDB;
    }

    getCommonNames() {
        return this.#commonNames;
    }

    getFamily() {
        return Genera.getFamily( this.#genus );
    }

    getFESA() {
        return this.#fesa;
    }

    getFileName( ext = "html" ) {
        return this.getBaseFileName() + "." + ext;
    }

    getGenus() {
        return Genera.getGenus( this.#genus );
    }

    getGenusName() {
        return this.#genus;
    }

    getGlobalRank() {
        return this.#rankGlobal;
    }

    getHTMLLink( href = true, includeRPI = true ) {
        href = href ? ( "./" + this.getFileName() ) : undefined;
        let className = this.isNative() ? "native" : "non-native";
        if ( includeRPI && this.isRare() ) {
            className = "rare";
        }
        const attributes = { class: className };
        const link = HTML.wrap( "span", HTML.getLink( href, this.getName() ), attributes );
        if ( className === "rare" ) {
            return HTML.getToolTip( link, this.getRPIRankAndThreatTooltip(), { icon: false } );
        }
        return link;
    }

    getINatID() {
        return this.#iNatID;
    }

    getINatName() {
        const name = this.#iNatSyn ? this.#iNatSyn : this.getName();
        return name.replace( / (subsp|var)\./, "" ).replace( "×", "× " );
    }

    getINatSyn() {
        return this.#iNatSyn;
    }

    getINatTaxonLink() {
        const iNatID = this.getINatID();
        if ( !iNatID ) {
            return "";
        }
        const link = HTML.getLink( "https://www.inaturalist.org/taxa/" + iNatID, "iNaturalist", {}, true );
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

    getRPIRankAndThreatTooltip() {
        return RarePlants.getRPIRankAndThreatDescriptions( this.getRPIRankAndThreat() ).join( "<br>" );
    }

    getRPITaxonLink() {
        const rpiID = this.getRPIID();
        if ( !rpiID ) {
            return "";
        }
        const link = HTML.getLink( "https://rareplants.cnps.org/Plants/Details/" + rpiID, "CNPS Rare Plant Inventory", {}, true );
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

    /**
     * Determine whether a species is a local native.
     * @returns {boolean} true if taxon is a local native; false if not a CA native, or native elsewhere in CA.
     */
    isNative() {
        return this.#status === "N";
    }

    isRare() {
        return this.getRPIRank() !== undefined;
    }

}

export { Taxon };