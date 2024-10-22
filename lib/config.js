import * as path from "node:path";
import * as url from "node:url";
import { Files } from "./files.js";

class Config {
    static #packageDir = path.dirname(
        path.dirname(url.fileURLToPath(import.meta.url))
    );

    /** @type {Object<string,Object<string,Object<string,{}>>>} */
    #config = {};

    /**
     * @param {string} dataDir
     */
    constructor(dataDir) {
        this.#config = JSON.parse(Files.read(dataDir + "/config.json"));
    }

    /**
     * @param {string} prefix
     * @param {string} name
     * @param {string} [subcat]
     * @param {string} [dflt]
     * @returns {string|undefined}
     */
    getConfigValue(prefix, name, subcat, dflt) {
        const obj = this.#config[prefix];
        if (obj) {
            if (Object.hasOwn(obj, name)) {
                const nameObj = obj[name];
                if (nameObj === undefined) {
                    return dflt;
                }
                if (subcat === undefined) {
                    return typeof nameObj === "string" ? nameObj : dflt;
                }
                if (Object.hasOwn(nameObj, subcat)) {
                    const v = nameObj[subcat];
                    return typeof v === "string" ? v : dflt;
                }
            }
        }
        return dflt;
    }

    /**
     * @returns {string[]}
     */
    getCountyCodes() {
        const counties = this.#config["counties"];
        if (counties instanceof Array) {
            return counties;
        }
        return [];
    }

    /**
     * @param {string} name
     * @param {string} dflt
     * @returns {string}
     */
    getLabel(name, dflt) {
        const label = this.getConfigValue("labels", name, undefined, dflt);
        if (label === undefined) {
            throw new Error();
        }
        return label;
    }

    /**
     * @returns {string}
     */
    static getPackageDir() {
        return this.#packageDir;
    }
}

export { Config };
