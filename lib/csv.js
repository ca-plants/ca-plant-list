import * as fs from "node:fs";
import path from "node:path";
import { finished } from "stream/promises";
import { parse as parseSync } from "csv-parse/sync";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";

export class CSV {
    /**
     * @param {string} fileName
     * @param {import("csv-parse").ColumnOption[]|boolean|function (string[]):string[]} columns
     * @param {string|undefined} delimiter
     * @returns {import("csv-parse").Options}
     */
    static #getOptions(fileName, columns, delimiter) {
        /** @type {import("csv-parse").Options} */
        const options = { relax_column_count_less: true, bom: true };
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
     * @deprecated Use parseFileStream
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
     * @template T
     * @param {string} fileName
     * @param {function (T):void} callback
     */
    static async parseFileStream(fileName, callback) {
        const options = this.#getOptions(fileName, true, undefined);
        const processFile = async () => {
            const parser = fs.createReadStream(fileName).pipe(parse(options));
            parser.on("readable", function () {
                let record;
                while ((record = parser.read()) !== null) {
                    callback(record);
                }
            });
            await finished(parser);
        };
        // Parse the CSV content
        await processFile();
    }

    /**
     * @template T
     * @param {string} fileName
     * @param {boolean|import("csv-parse").ColumnOption[]|function (string[]):string[]} [columns]
     * @param {string} [delimiter]
     * @returns {T[]}
     */
    static readFile(fileName, columns = true, delimiter) {
        const content = fs.readFileSync(fileName);
        const options = this.#getOptions(fileName, columns, delimiter);
        /** @type {T[]} */
        // @ts-ignore - need to get options @type to have correct column options
        return parseSync(content, options);
    }

    /**
     * @template T
     * @param {string} fileName
     * @param {string} [delimiter]
     * @returns {{headers:string[],data:T[]}}
     */
    static readFileAndHeaders(fileName, delimiter) {
        let headers;
        /**
         * @param {string[]} h
         */
        function getHeaders(h) {
            headers = h;
            return h;
        }

        const content = fs.readFileSync(fileName);
        const options = this.#getOptions(fileName, getHeaders, delimiter);

        /** @type {T[]} */
        // @ts-ignore - need to get options @type to have correct column options
        const data = parseSync(content, options);
        if (headers === undefined) {
            throw new Error();
        }
        return { headers: headers, data: data };
    }

    /**
     * @param {string} fileName
     * @param {string[][]} data
     * @param {string[]} [headerData]
     */
    static writeFileArray(fileName, data, headerData) {
        const header = headerData ? stringify([headerData]) : "";
        const content = header + stringify(data);
        fs.writeFileSync(fileName, content);
    }

    /**
     * @param {string} fileName
     * @param {Object<string,any>[]} data
     * @param {string[]} headerData
     */
    static writeFileObject(fileName, data, headerData) {
        const content = stringify(data, { columns: headerData, header: true });
        fs.writeFileSync(fileName, content.replaceAll(/,+\n/g, "\n"));
    }
}
