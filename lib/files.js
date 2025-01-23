import * as fs from "node:fs";
import * as path from "node:path";
import { default as unzipper } from "unzipper";

class Files {
    /**
     * @param {string} srcDir
     * @param {string} targetDir
     */
    static copyDir(srcDir, targetDir) {
        fs.cpSync(srcDir, targetDir, { recursive: true });
    }

    /**
     * @param {string} fileName
     * @param {*} inStream
     * @access private
     */
    static #createFileFromStream(fileName, inStream) {
        /**
         *
         * @param {string} fileName
         * @param {*} inStream
         * @param {*} resolve
         */
        function implementation(fileName, inStream, resolve) {
            const outStream = fs.createWriteStream(fileName);
            outStream.on("finish", () => {
                resolve(true);
            });
            inStream.pipe(outStream);
        }

        return new Promise((resolve) => {
            implementation(fileName, inStream, resolve);
        });
    }

    /**
     * @param {string} path
     * @returns {boolean}
     */
    static exists(path) {
        return fs.existsSync(path);
    }

    /**
     * Retrieve data from a URL and write it to a file. If the response status is anything other than 200, an Error is thrown.
     * @param {string|URL} url
     * @param {string|undefined} targetFileName If targetFileName is undefined, the data will be retrieved but not written to a file.
     * @param {Object} [headers={}] Request Headers.
     * @returns {Promise<Headers>} The Response headers.
     */
    static async fetch(url, targetFileName, headers = {}) {
        const response = await fetch(url, headers);
        if (response.status !== 200) {
            throw new Error(response.status + " retrieving " + url);
        }
        const data = await response.blob();
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (targetFileName) {
            fs.writeFileSync(targetFileName, buffer);
        }
        return response.headers;
    }

    /**
     * @param {string} path
     * @returns {string[]}
     */
    static getDirEntries(path) {
        return fs.readdirSync(path);
    }

    /**
     * @param {string} path
     * @returns {boolean}
     */
    static isDir(path) {
        const stats = fs.statSync(path, { throwIfNoEntry: false });
        return stats !== undefined && stats.isDirectory();
    }

    /**
     * @param {string[]} paths
     * @returns {string}
     */
    static join(...paths) {
        return path.join(...paths).replaceAll("\\", "/");
    }

    /**
     * @param {string} path
     */
    static mkdir(path) {
        fs.mkdirSync(path, { recursive: true });
    }

    /**
     * @param {string} path
     * @returns {string}
     */
    static read(path) {
        return fs.readFileSync(path, "utf8");
    }

    /**
     * @param {string} dir
     */
    static rmDir(dir) {
        fs.rmSync(dir, {
            force: true,
            recursive: true,
            maxRetries: 2,
            retryDelay: 1000,
        });
    }

    /**
     * @param {string} path
     * @param {string} data
     * @param {boolean} overwrite
     */
    static write(path, data, overwrite = false) {
        if (!overwrite && this.exists(path)) {
            throw new Error(path + " already exists");
        }
        fs.writeFileSync(path, data);
    }

    /**
     * @param {string} zipFilePath
     * @param {string} fileNameToUnzip
     * @param {string} targetFilePath
     */
    static async zipFileExtract(zipFilePath, fileNameToUnzip, targetFilePath) {
        const zipDir = await unzipper.Open.file(zipFilePath);
        for (const entry of zipDir.files) {
            if (entry.path === fileNameToUnzip) {
                await this.#createFileFromStream(
                    targetFilePath,
                    entry.stream(),
                );
                break;
            }
        }
    }
}

export { Files };
