import { Config } from "./config.js";
import { ErrorLog } from "./errorlog.js";
import { Genera } from "./genera.js";

class Taxon {

    #name;
    #genus;
    #commonNames;
    #status;
    #jepsonID;
    #calRecNum;
    #iNatID;
    #iNatName;
    #rankRPI;
    #synonyms = [];

    constructor( name, commonNames, status, jepsonID, calRecNum, iNatID, rankRPI ) {
        this.#name = name;
        this.#genus = name.split( " " )[ 0 ];
        this.#commonNames = commonNames ? commonNames.split( "," ).map( t => t.trim() ) : [];
        this.#status = status;
        this.#jepsonID = jepsonID;
        this.#calRecNum = calRecNum;
        this.#iNatID = iNatID;
        this.#rankRPI = rankRPI;
        Genera.addTaxon( this );
        if ( !calRecNum ) {
            ErrorLog.log( this.getName(), "has no Calflora ID" );
        }
        if ( !iNatID ) {
            ErrorLog.log( this.getName(), "has no iNat ID" );
        }
    }

    addSynonym( syn, type ) {
        this.#synonyms.push( syn );
        if ( type === "INAT" ) {
            this.#iNatName = syn;
        }
    }

    getCalfloraName() {
        return this.#name.replace( " subsp.", " ssp." ).replace( "×", "X" );
    }

    getCalRecNum() {
        return this.#calRecNum;
    }

    getCommonNames() {
        return this.#commonNames;
    }

    getFamily() {
        return Genera.getFamily( this.#genus );
    }

    getFileName( ext = "html" ) {
        // Convert spaces to "-" and remove ".".
        return this.getName().replaceAll( " ", "-" ).replaceAll( ".", "" ) + "." + ext;
    }

    getGenus() {
        return Genera.getGenus( this.#genus );
    }

    getGenusName() {
        return this.#genus;
    }

    getHTMLClassName() {
        return this.isNative() ? ( this.isRare() ? "rare" : "native" ) : "non-native";
    }

    getINatID() {
        return this.#iNatID;
    }

    getINatName() {
        const name = this.#iNatName ? this.#iNatName : this.#name;
        return name.replace( / (subsp|var)\./, "" ).replace( "×", "× " );
    }

    getJepsonID() {
        return this.#jepsonID;
    }

    getName() {
        return this.#name;
    }

    getRankRPI() {
        return this.#rankRPI;
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

    isNative() {
        return this.#status === "N";
    }

    isRare() {
        return this.getRankRPI() !== undefined;
    }

}

export { Taxon };