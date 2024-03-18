import * as fs from "node:fs";
import * as path from "node:path";

class ErrorLog {
    #fileName;
    #echo;
    /** @type string[] */
    #errors = [];

    /**
     * @param {string} fileName
     * @param {boolean} echo
     */
    constructor(fileName, echo = false) {
        this.#fileName = fileName;
        this.#echo = echo;
    }

    /**
     * @param  {...string} args
     */
    log(...args) {
        if (this.#echo) {
            console.log(args.join());
        }
        this.#errors.push(args.join("\t"));
    }

    write() {
        // Make sure directory exists.
        fs.mkdirSync(path.dirname(this.#fileName), { recursive: true });
        fs.writeFileSync(this.#fileName, this.#errors.join("\n"));
    }
}

export { ErrorLog };
