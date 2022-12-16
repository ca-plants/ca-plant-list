/**
 * @deprecated
 */
export const HTML_OPTIONS = {
    OPEN_NEW: 1,
    NO_ESCAPE: 2,
};

/** HTML utility functions. */
export class HTML {

    static arrayToLI( items ) {
        return items.reduce( ( itemHTML, currVal ) => itemHTML + "<li>" + currVal + "</li>", "" );
    }

    static escapeAttribute( value ) {
        return value.replaceAll( "\"", "&quot;" );
    }

    static escapeText( text ) {
        return text.replaceAll( "&", "&amp;" ).replaceAll( "<", "&lt;" ).replaceAll( ">", "&gt;" );
    }

    /**
     * @deprecated
     */
    static getElement( elName, text, attributes = {}, options = 0 ) {
        let html = "<" + elName;
        html += this.renderAttributes( attributes );
        if ( !( options & HTML_OPTIONS.NO_ESCAPE ) ) {
            text = this.escapeText( text );
        }
        html += ">" + text + "</" + elName + ">";
        return html;

    }

    static #getElement( elName, text, attributes, escape ) {
        let html = "<" + elName;
        html += this.renderAttributes( attributes );
        if ( escape && ( typeof text === "string" ) ) {
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

    static getToolTip( text, tooltip ) {
        const func = text.charAt( 0 ) === "<" ? HTML.wrap : HTML.textElement;
        return func( "span", text + " ⓘ", { title: tooltip } );
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

    static textElement( elName, text, attributes = {} ) {
        return HTML.#getElement( elName, text, attributes, true );
    }

    static wrap( elName, text, attributes = {} ) {
        return HTML.#getElement( elName, text, attributes, false );
    }

}
