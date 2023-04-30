import { Families } from "./families.js";
import { Files } from "./files.js";

class Genera {

    static #genera;

    static addTaxon( taxon ) {

        const genusName = taxon.getGenusName();
        const genusData = this.#genera[ genusName ];
        if ( !genusData ) {
            console.log( taxon.getName() + " genus not found" );
            return;
        }

        if ( genusData.taxa === undefined ) {
            genusData.taxa = [];
        }
        genusData.taxa.push( taxon );

        const family = this.getFamily( genusName );
        if ( !family ) {
            console.log( taxon.getName() + " family not found" );
            return;
        }
        family.addTaxon( taxon );
    }

    static getGenus( genusName ) {
        return new Genus( this.#genera[ genusName ] );
    }

    static getFamily( genusName ) {
        const genus = this.#genera[ genusName ];
        if ( genus ) {
            return Families.getFamily( genus.family );
        }
    }

    static init( dataDir ) {
        this.#genera = JSON.parse( Files.read( dataDir + "/genera.json" ) );
    }

}

class Genus {

    #data;

    constructor( data ) {
        this.#data = data;
    }

    getTaxa() {
        return this.#data.taxa.sort( ( a, b ) => a.getName().localeCompare( b.getName() ) );
    }
}

export { Genera };