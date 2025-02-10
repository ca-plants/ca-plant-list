export class Utils {
    /**
     * @param {string} name
     * @param {Object<string,string>} attributes
     * @param {string} [content]
     * @returns {Element}
     */
    static domElement(name, attributes = {}, content) {
        const e = document.createElement(name);
        for (const [k, v] of Object.entries(attributes)) {
            e.setAttribute(k, v);
        }
        if (content) {
            e.textContent = content;
        }
        return e;
    }

    /**
     * @param {string} href
     * @param {string} text
     * @param {Object<string,string>} attributes
     * @returns {Element}
     */
    static domLink(href, text, attributes = {}) {
        const e = this.domElement(
            "a",
            Object.assign({ href: href }, attributes),
        );
        e.textContent = text;
        return e;
    }

    /**
     * @param {string} name
     * @returns {Element}
     */
    static domTaxonLink(name) {
        return this.domLink(
            "./" + name.replaceAll(".", "").replaceAll(" ", "-") + ".html",
            name,
        );
    }

    /**
     * @param {string} id
     * @returns {HTMLElement}
     */
    static getElement(id) {
        const e = document.getElementById(id);
        if (e === null) {
            throw new Error();
        }
        return e;
    }
}
