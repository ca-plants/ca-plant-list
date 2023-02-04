import { Utils } from "./utils.js";

const MIN_LEN = 2;
const MAX_RESULTS = 50;

class Search {

    static #debounceTimer;
    static #searchData;

    static #debounce( timeout = 500 ) {
        clearTimeout( this.#debounceTimer );
        this.#debounceTimer = setTimeout( Search.#doSearch, timeout );
    }

    static #doSearch() {

        function matchTaxon( taxon, value ) {

            function matchSynonyms( syns, value ) {
                const matchedIndexes = [];
                if ( syns ) {
                    for ( let index = 0; index < syns.length; index++ ) {
                        if ( syns[ index ].includes( value ) ) {
                            matchedIndexes.push( index );
                        }
                    }
                }
                return matchedIndexes;
            }

            const rawData = taxon[ 0 ];
            const name = taxon[ 1 ];
            const cn = taxon[ 2 ];
            const syns = matchSynonyms( taxon[ 3 ], value );
            if ( syns.length > 0 ) {
                // Include any matching synonyms.
                for ( const index of syns ) {
                    matches.push( [ rawData[ 0 ], rawData[ 1 ], rawData[ 2 ][ index ] ] );
                }
            } else {
                // No synonyms match; see if the scientific or common names match.
                console.log( name )
                const namesMatch = name.includes( value ) || ( cn && cn.includes( value ) );
                if ( namesMatch ) {
                    matches.push( [ rawData[ 0 ], rawData[ 1 ] ] );
                }
            }

        }

        Search.#debounceTimer = undefined;

        const value = Search.#normalizeName( document.getElementById( "name" ).value );

        const matches = [];
        const shouldSearch = ( value.length >= MIN_LEN );

        if ( shouldSearch ) {

            // If the search data is not done generating, try again later.
            if ( !Search.#searchData ) {
                this.#debounce( Search.#doSearch );
            }

            for ( const taxon of Search.#searchData ) {
                matchTaxon( taxon, value );
            }
        }

        const eBody = document.createElement( "tbody" );
        if ( matches.length <= MAX_RESULTS ) {
            for ( const match of matches ) {

                const tr = document.createElement( "tr" );

                // Scientific name.
                const name = match[ 0 ];
                const syn = match[ 2 ];
                const td1 = document.createElement( "td" );
                const link = Utils.domTaxonLink( name );
                td1.appendChild( link );
                if ( syn ) {
                    td1.appendChild( document.createTextNode( " (" + syn + ")" ) );
                }
                tr.appendChild( td1 );

                const cn = match[ 1 ];
                const td2 = document.createElement( "td" );
                if ( cn ) {
                    td2.textContent = cn;
                }
                tr.appendChild( td2 );

                eBody.appendChild( tr );

            }
        }

        // Delete current message
        const eMessage = document.getElementById( "message" );
        if ( eMessage.firstChild ) {
            eMessage.removeChild( eMessage.firstChild );
        }
        if ( shouldSearch ) {
            if ( matches.length === 0 ) {
                eMessage.textContent = "Nothing found.";
            }
            if ( matches.length > MAX_RESULTS ) {
                eMessage.textContent = "Too many results.";
            }
        }

        // Delete current results
        const eTable = document.getElementById( "results" );
        if ( eTable.firstChild ) {
            eTable.removeChild( eTable.firstChild );
        }

        eTable.appendChild( eBody );
    }

    static async generateSearchData() {
        const searchData = [];
        // eslint-disable-next-line no-undef
        for ( const taxon of NAMES ) {
            const taxonData = [ taxon ];
            taxonData.push( this.#normalizeName( taxon[ 0 ] ) );
            if ( taxon[ 1 ] ) {
                taxonData.push( taxon[ 1 ].toLowerCase() );
            }
            if ( taxon[ 2 ] ) {
                const syns = [];
                for ( const syn of taxon[ 2 ] ) {
                    syns.push( this.#normalizeName( syn ) );
                }
                taxonData[ 3 ] = syns;
            }
            searchData.push( taxonData );
        }
        this.#searchData = searchData;
    }

    static #handleChange() {
        this.#debounce();
    }

    static #handleSubmit() {
        this.#debounce( 0 );
    }

    static init() {
        this.generateSearchData();
        const eName = document.getElementById( "name" );
        eName.focus();
        eName.oninput = ( ev ) => { return this.#handleChange( ev ); };
        document.getElementById( "search_form" ).onsubmit = () => { this.#handleSubmit(); return false; };
    }

    static #normalizeName( name ) {
        return name.toLowerCase().replace( / (subsp|var)\./, "" );
    }

}

Search.init();