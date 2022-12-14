class Utils {

    static domElement( name, attributes = {}, content ) {
        const e = document.createElement( name );
        for ( const [ k, v ] of Object.entries( attributes ) ) {
            e.setAttribute( k, v );
        }
        if ( content ) {
            e.textContent = content;
        }
        return e;
    }

    static domLink( href, text, attributes = {} ) {
        const e = this.domElement( "a", Object.assign( { href: href }, attributes ) );
        e.textContent = text;
        return e;
    }

    static domTaxonLink( name ) {
        return this.domLink( "./" + name.replaceAll( ".", "" ).replaceAll( " ", "-" ) + ".html", name );
    }

}

export { Utils };
