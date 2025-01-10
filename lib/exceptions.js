import { Config } from "./config.js";
import { Files } from "./files.js";

class Exceptions {
    /** @type {Object<string,Object<string,Object<string,string>>>} */
    #exceptions = {};

    /**
     * @param {string} dir
     */
    constructor(dir) {
        /**
         * @param {string} fileName
         */
        function readConfig(fileName) {
            return JSON.parse(Files.read(fileName));
        }

        // Read default configuration.
        this.#exceptions = readConfig(
            Config.getPackageDir() + "/data/exceptions.json",
        );

        // Add/overwrite with local configuration.
        const localExceptions = readConfig(dir + "/exceptions.json");
        for (const [k, v] of Object.entries(localExceptions)) {
            this.#exceptions[k] = v;
            // Tag as a local exception so we can distinguish between global and local.
            v.local = true;
        }
    }

    /**
     * @returns {[string,Object<string,Object<string,string>>][]}
     */
    getExceptions() {
        return Object.entries(this.#exceptions);
    }

    /**
     * @param {string} name
     * @param {string} cat
     * @param {string} subcat
     * @param {string} [defaultValue]
     * @returns {string|undefined}
     */
    getValue(name, cat, subcat, defaultValue) {
        const taxonData = this.#exceptions[name];
        if (taxonData) {
            const catData = taxonData[cat];
            if (catData) {
                const val = catData[subcat];
                return val === undefined ? defaultValue : val;
            }
        }
        return defaultValue;
    }

    /**
     * @param {string} name
     * @param {string} cat
     * @param {string} subcat
     */
    hasException(name, cat, subcat) {
        const taxonData = this.#exceptions[name];
        if (taxonData) {
            const catData = taxonData[cat];
            if (catData) {
                return catData[subcat] !== undefined;
            }
        }
        return false;
    }
}

export { Exceptions };
