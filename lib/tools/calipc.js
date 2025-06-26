import * as path from "path";
import { Files } from "../files.js";
import { TaxaCSV } from "./taxacsv.js";
import { scrape } from "@htmltools/scrape";

export class CalIPC {
    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {boolean} update
     */
    static async analyze(
        toolsDataDir,
        dataDir,
        taxa,
        exceptions,
        errorLog,
        update,
    ) {
        const toolsDataPath = toolsDataDir + "/calipc";
        // Create data directory if it's not there.
        Files.mkdir(toolsDataPath);

        const calipcFileName = path.join(toolsDataPath, "inventory.html");
        if (!Files.exists(calipcFileName)) {
            console.info("retrieving " + calipcFileName);
            await Files.fetch(
                "https://www.cal-ipc.org/plants/inventory/",
                calipcFileName,
            );
        }

        const parsed = scrape.parseFile(calipcFileName);
        const links = scrape.getSubtrees(parsed, (e) => {
            if (e.tagName !== "td") {
                return false;
            }
            const className = scrape.getAttr(e, "class");
            return className === "it-latin";
        });

        /** @type {Map<string,string>} */
        const calipcTaxa = new Map();
        for (const link of links) {
            const name = scrape.getTextContent(link);
            const url = scrape.getAttr(link.children[0], "href");
            if (!url) {
                console.warn(`Cal-IPC url not found for ${name}`);
                continue;
            }
            const id = url.match(/\/profile\/(.*)\//);
            if (!id) {
                console.warn(`Cal-IPC url mismatch for ${url}`);
                continue;
            }
            calipcTaxa.set(name, id[1]);
        }

        const idsToUpdate = new Map();

        for (const taxon of taxa.getTaxonList()) {
            const name = taxon.getName();
            if (name.includes(" unknown")) {
                continue;
            }
            const calipcName = taxon.getCalIPCName();
            const calipcData = calipcTaxa.get(calipcName);
            if (!calipcData) {
                continue;
            }

            // Check native status.
            if (taxon.isCANative()) {
                errorLog.log(name, "is native but listed in Cal-IPC");
            }

            if (calipcData !== taxon.getCalIPCID()) {
                errorLog.log(
                    name,
                    "Cal-IPC ID in Cal-IPC is different than taxa.csv",
                    calipcData,
                    taxon.getCalIPCID(),
                );
                idsToUpdate.set(name, calipcData);
            }
        }

        if (update) {
            this.#updateIds(dataDir, idsToUpdate);
        }
    }

    /**
     * @param {string} dataDir
     * @param {Map<string,string>} idsToUpdate
     */
    static #updateIds(dataDir, idsToUpdate) {
        const taxa = new TaxaCSV(dataDir);
        for (const taxonData of taxa.getTaxa()) {
            const id = idsToUpdate.get(taxonData.taxon_name);
            if (!id) {
                continue;
            }
            taxonData["calipc"] = id;
        }
        taxa.write();
    }
}
