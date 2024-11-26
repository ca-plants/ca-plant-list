import * as fs from "node:fs";
import path from "node:path";
import { finished } from "stream/promises";
import { parse as parseSync } from "csv-parse/sync";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";

class CSV {
    /**
     * @param {string} dir
     * @param {string} fileName
     */
    static getMap(dir, fileName) {
        /** @type {string[]} */
        let headers = [];

        /**
         * @param {string[]} h
         */
        function setHeaders(h) {
            headers = h;
            return h;
        }

        const csv = this.parseFile(dir, fileName, setHeaders);
        /** @type {Object<string,string[]>} */
        const map = {};
        for (const row of csv) {
            map[row[headers[0]]] = row[headers[1]];
        }

        return map;
    }

    /**
     * @param {string} fileName
     * @param {import("csv-parse").ColumnOption[]|boolean|function (string[]):string[]} columns
     * @param {string|undefined} delimiter
     */
    static #getOptions(fileName, columns, delimiter) {
        /** @type {import("csv-parse").Options} */
        const options = { relax_column_count_less: true };
        options.columns = columns;
        if (path.extname(fileName) === ".tsv") {
            options.delimiter = "\t";
            options.quote = false;
        } else {
            options.delimiter = delimiter ? delimiter : ",";
        }
        if (options.delimiter === "\t") {
            options.quote = null;
        }
        return options;
    }

    /**
     * @param {string} dir
     * @param {string} fileName
     * @param {boolean|import("csv-parse").ColumnOption[]|function (string[]):string[]} [columns]
     * @param {string} [delimiter]
     * @deprecated use readFile
     */
    static parseFile(dir, fileName, columns = true, delimiter) {
        return this.readFile(dir + "/" + fileName, columns, delimiter);
    }

    /**
     * @param {string} dir
     * @param {string} fileName
     * @param {boolean|import("csv-parse").ColumnOption[]} columns
     * @param {string|undefined} delimiter
     * @param {function (any):void} callback
     */
    static async parseStream(
        dir,
        fileName,
        columns = true,
        delimiter,
        callback,
    ) {
        const options = this.#getOptions(fileName, columns, delimiter);
        const processFile = async () => {
            /** @type {string[][]} */
            const records = [];
            const parser = fs
                .createReadStream(dir + "/" + fileName)
                .pipe(parse(options));
            parser.on("readable", function () {
                let record;
                while ((record = parser.read()) !== null) {
                    callback(record);
                }
            });
            await finished(parser);
            return records;
        };
        // Parse the CSV content
        await processFile();
    }

    /**
     * @param {string} fileName
     * @param {boolean|import("csv-parse").ColumnOption[]|function (string[]):string[]} [columns]
     * @param {string} [delimiter]
     */
    static readFile(fileName, columns = true, delimiter) {
        const content = fs.readFileSync(fileName);
        const options = this.#getOptions(fileName, columns, delimiter);
        return parseSync(content, options);
    }

    /**
     *
     * @param {string} fileName
     * @param {string[][]} data
     * @param {string[]} [headerData]
     */
    static writeFile(fileName, data, headerData) {
        const header = headerData ? stringify([headerData]) : "";
        const content = header + stringify(data);
        fs.writeFileSync(fileName, content);
    }
}

export { CSV };
