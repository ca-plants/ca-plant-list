const MIN_LEN = 2;
const MAX_RESULTS = 50;

class Search {

    static #debounceTimer;

    static #debounce( func ) {
        clearTimeout( this.#debounceTimer );
        this.#debounceTimer = setTimeout( func, 500 );
    }

    static #doSearch() {

        Search.#debounceTimer = undefined;

        const value = document.getElementById( "common-name" ).value.toLowerCase();

        const matches = [];
        const shouldSearch = ( value.length >= MIN_LEN );

        if ( shouldSearch ) {
            // eslint-disable-next-line no-undef
            for ( const key of Object.keys( COMMON_NAMES ) ) {
                if ( key.includes( value ) ) {
                    matches.push( key );
                }
            }
        }

        const eBody = document.createElement( "tbody" );
        if ( matches.length <= MAX_RESULTS ) {
            for ( const match of matches ) {
                // eslint-disable-next-line no-undef
                const data = COMMON_NAMES[ match ];
                for ( const name of data.names ) {
                    const tr = document.createElement( "tr" );
                    const td1 = document.createElement( "td" );
                    const td2 = document.createElement( "td" );
                    const link = document.createElement( "a" );
                    td1.textContent = data.cn;
                    link.setAttribute( "href", "./" + name.replaceAll( ".", "" ).replaceAll( " ", "-" ) + ".html" );
                    link.textContent = name;
                    td2.appendChild( link );
                    tr.appendChild( td1 );
                    tr.appendChild( td2 );
                    eBody.appendChild( tr );
                }
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

    static #handleChange() {
        this.#debounce( Search.#doSearch );
    }

    static init() {
        const eName = document.getElementById( "common-name" );
        eName.focus();
        eName.oninput = ( ev ) => { return this.#handleChange( ev ); };
    }

}

Search.init();