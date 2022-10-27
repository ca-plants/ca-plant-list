const HTML_OPTIONS = {
    OPEN_NEW: 1,
    NO_ESCAPE: 2,
};

class HTML {

    static arrayToLI( items ) {
        return items.reduce( ( itemHTML, currVal ) => itemHTML + "<li>" + currVal + "</li>", "" );
    }

    static escapeAttribute( value ) {
        return value.replaceAll( "\"", "&quot;" );
    }

    static escapeText( text ) {
        return text.replaceAll( "&", "&amp;" ).replaceAll( "<", "&lt;" ).replaceAll( ">", "&gt;" );
    }

    static getElement( elName, text, attributes = {}, options = 0 ) {
        let html = "<" + elName;
        html += this.renderAttributes( attributes );
        if ( !( options & HTML_OPTIONS.NO_ESCAPE ) ) {
            text = this.escapeText( text );
        }
        html += ">" + text + "</" + elName + ">";
        return html;

    }

    static getLink( href, linkText, attributes = {}, options = 0 ) {
        let html = "<a";
        if ( href !== undefined ) {
            html += this.renderAttribute( "href", href );
        }
        html += this.renderAttributes( attributes );
        if ( options & HTML_OPTIONS.OPEN_NEW ) {
            html += this.renderAttribute( "target", "_blank" );
        }
        return html + ">" + this.escapeText( linkText ) + "</a >";
    }

    static renderAttribute( n, v ) {
        return " " + n + "=\"" + this.escapeAttribute( v ) + "\"";
    }

    static renderAttributes( attributes ) {
        let html = "";
        for ( const [ k, v ] of Object.entries( attributes ) ) {
            html += this.renderAttribute( k, v );
        }
        return html;
    }

}

export { HTML, HTML_OPTIONS };