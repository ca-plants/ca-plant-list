import { Utils } from "./utils.js";

/**
 * @typedef {[string]|[string,string]|[string,string|undefined,string[]]} RawSearchData
 * @typedef {{raw:RawSearchData,searchSci:string,searchCommon?:string,synonyms?:string[]}} SearchData
 */

const MIN_LEN = 2;
const MAX_RESULTS = 50;

class Search {
    /** @type {number|undefined} */
    static #debounceTimer;
    /** @type {SearchData[]} */
    static #searchData;

    /**
     * @param {number} [timeout]
     */
    static #debounce(timeout = 500) {
        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = window.setTimeout(Search.#doSearch, timeout);
    }

    static #doSearch() {
        /**
         * @param {SearchData} taxon
         * @param {string} value
         */
        function matchTaxon(taxon, value) {
            /**
             * @param {string[]|undefined} syns
             * @param {string} value
             * @returns {number[]}
             */
            function matchSynonyms(syns, value) {
                const matchedIndexes = [];
                if (syns) {
                    for (let index = 0; index < syns.length; index++) {
                        if (syns[index].includes(value)) {
                            matchedIndexes.push(index);
                        }
                    }
                }
                return matchedIndexes;
            }

            const name = taxon.searchSci;
            const cn = taxon.searchCommon;
            const syns = matchSynonyms(taxon.synonyms, value);
            if (syns.length > 0) {
                // Include any matching synonyms.
                for (const index of syns) {
                    matches.push([
                        taxon.raw[0],
                        taxon.raw[1],
                        taxon.raw[2] ? taxon.raw[2][index] : undefined,
                    ]);
                }
            } else {
                // No synonyms match; see if the scientific or common names match.
                const namesMatch =
                    name.includes(value) || (cn && cn.includes(value));
                if (namesMatch) {
                    matches.push([taxon.raw[0], taxon.raw[1]]);
                }
            }
        }

        Search.#debounceTimer = undefined;

        const input = Utils.getElement("name");
        if (!(input instanceof HTMLInputElement)) {
            throw new Error();
        }
        const value = Search.#normalizeName(input.value);

        /**
         * @type {([string,string|undefined]|[string,string|undefined,string|undefined])[]}
         */
        const matches = [];
        const shouldSearch = value.length >= MIN_LEN;

        if (shouldSearch) {
            // If the search data is not done generating, try again later.
            if (!Search.#searchData) {
                this.#debounce();
            }

            for (const taxon of Search.#searchData) {
                matchTaxon(taxon, value);
            }
        }

        const eBody = document.createElement("tbody");
        if (matches.length <= MAX_RESULTS) {
            for (const match of matches) {
                const tr = document.createElement("tr");

                // Scientific name.
                const name = match[0];
                const syn = match[2];
                const td1 = document.createElement("td");
                const link = Utils.domTaxonLink(name);
                td1.appendChild(link);
                if (syn) {
                    td1.appendChild(document.createTextNode(" (" + syn + ")"));
                }
                tr.appendChild(td1);

                const cn = match[1];
                const td2 = document.createElement("td");
                if (cn) {
                    td2.textContent = cn;
                }
                tr.appendChild(td2);

                eBody.appendChild(tr);
            }
        }

        // Delete current message
        const eMessage = Utils.getElement("message");
        if (eMessage.firstChild) {
            eMessage.removeChild(eMessage.firstChild);
        }
        if (shouldSearch) {
            if (matches.length === 0) {
                eMessage.textContent = "Nothing found.";
            }
            if (matches.length > MAX_RESULTS) {
                eMessage.textContent = "Too many results.";
            }
        }

        // Delete current results
        const eTable = Utils.getElement("results");
        if (eTable.firstChild) {
            eTable.removeChild(eTable.firstChild);
        }

        eTable.appendChild(eBody);
    }

    static async generateSearchData() {
        /** @type {SearchData[]} */
        const searchData = [];

        /** @type {RawSearchData[]} */
        // @ts-ignore
        // eslint-disable-next-line no-undef
        const names = NAMES;

        for (const taxon of names) {
            /** @type {SearchData} */
            const taxonData = {
                raw: taxon,
                searchSci: this.#normalizeName(taxon[0]),
            };
            if (taxon[1]) {
                taxonData.searchCommon = taxon[1].toLowerCase();
            }
            if (taxon[2]) {
                const syns = [];
                for (const syn of taxon[2]) {
                    syns.push(this.#normalizeName(syn));
                }
                taxonData.synonyms = syns;
            }
            searchData.push(taxonData);
        }
        this.#searchData = searchData;
    }

    static #handleChange() {
        this.#debounce();
    }

    static #handleSubmit() {
        this.#debounce(0);
    }

    static init() {
        this.generateSearchData();
        const eName = Utils.getElement("name");
        eName.focus();
        eName.oninput = () => {
            return this.#handleChange();
        };
        Utils.getElement("search_form").onsubmit = () => {
            this.#handleSubmit();
            return false;
        };
    }

    /**
     * @param {string} name
     * @returns {string}
     */
    static #normalizeName(name) {
        return name.toLowerCase().replace(/ (subsp|var)\./, "");
    }
}

Search.init();
