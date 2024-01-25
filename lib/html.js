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
        // If tag is empty, make it self-closing so it is XHTML (epub) compatible.
        if ( text === "" ) {
            return html + "/>";
        }
        return html + ">" + text + "</" + elName + ">";
    }

    /**
     * Generate HTML for an &lt;a> element.
     * @param {string|undefined} href 
     * @param {string} linkText 
     * @param {Object} [attributes] 
     * @param {boolean} [openInNewWindow] true if the link should open in a new window.
     * @returns {string} an HTML &lt;a> element.
     */
    static getLink( href, linkText, attributes = {}, openInNewWindow ) {
        let html = "<a";
        if ( href !== undefined ) {
            html += this.renderAttribute( "href", href );
        }
        html += this.renderAttributes( attributes );
        if ( openInNewWindow ) {
            html += this.renderAttribute( "target", "_blank" );
        }
        return html + ">" + this.escapeText( linkText ) + "</a>";
    }

    /**
     * Get a Bootstrap formatted tooltip element.
     * @param {string} text - The text or HTML that should trigger the tooltip on hover.
     * @param {string} tooltip - The tooltip text or HTML.
     * @param {Object} options
     * @param {boolean} options.icon [true] display an icon after the text
     * @returns {string} A &lt;span> element to be used as a Bootstrap tooltip.
     */
    static getToolTip( text, tooltip, options = {} ) {
        const func = text.charAt( 0 ) === "<" ? HTML.wrap : HTML.textElement;
        if ( options.icon !== false ) {
            text += " ⓘ";
        }
        return func( "span", text, { "data-bs-html": "true", "title": tooltip } );
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
