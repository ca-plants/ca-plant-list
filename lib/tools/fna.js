import path from "node:path";
import { Files } from "../files.js";
import { scrape } from "@htmltools/scrape";
import { TaxaCSV } from "./taxacsv.js";

/**
 * @typedef {{name:string}} FNATaxon
 * @typedef {Map<string,FNATaxon>} FNATaxa
 */

export class FNA {
    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../taxa.js").Taxa} taxa
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {boolean} update
     */
    static async analyze(toolsDataDir, dataDir, taxa, errorLog, update) {
        const toolsDataPath = path.join(toolsDataDir, "fna");
        const fnaTaxa = await getFNATaxa(toolsDataPath);

        const namesToUpdate = new Map();

        for (const taxon of taxa.getTaxonList()) {
            const fnaName = getFNAName(taxon, fnaTaxa) ?? "";
            const taxonFNAName = taxon.getFNAName();
            if (fnaName !== taxonFNAName) {
                const name = taxon.getName();
                errorLog.log(
                    name,
                    "FNA name does not match name from FNA data",
                    taxonFNAName,
                    fnaName,
                );
                namesToUpdate.set(name, fnaName === name ? "true" : fnaName);
            }
        }

        if (update) {
            updateNames(dataDir, namesToUpdate);
        }
    }
}

/**
 * @param {import("../taxon.js").Taxon} taxon
 * @param {FNATaxa} fnaTaxa
 * @returns {string|undefined}
 */
function getFNAName(taxon, fnaTaxa) {
    /**
     * @param {string} input
     * @returns {string|undefined}
     */
    function getName(input) {
        if (fnaTaxa.has(input)) {
            return input;
        }

        // See if we can swap var./subsp. to find it.
        const parts = input.split(" ");
        if (parts.length === 4) {
            parts[2] = parts[2] === "var." ? "subsp." : "var.";
            input = parts.join(" ");
            if (fnaTaxa.has(input)) {
                return input;
            }
        }

        // If it's the nominate subsp/var, see if we can find the species.
        if (parts.length === 4 && parts[1] === parts[3]) {
            input = parts[0] + " " + parts[1];
            if (fnaTaxa.has(input)) {
                return input;
            }
        }
    }
    const name = getName(taxon.getName());
    if (name !== undefined) {
        return name;
    }

    // See if any synonyms match.
    for (const synonym of taxon.getSynonyms()) {
        const name = getName(synonym);
        if (name !== undefined) {
            return name;
        }
    }
}

/**
 * @param {string} toolsDataPath
 * @returns {Promise<FNATaxa>}
 */
async function getFNATaxa(toolsDataPath) {
    /** @type {FNATaxa} */
    const fnaTaxa = new Map();

    Files.mkdir(toolsDataPath);

    // Get list of volumes.
    const volumePage = path.join(toolsDataPath, "volumes.html");
    if (!Files.exists(volumePage)) {
        await Files.fetch(
            "http://floranorthamerica.org/Special:SearchByProperty/:Volume/",
            volumePage,
        );
    }

    const volDoc = scrape.parseFile(volumePage);
    const links = scrape.getSubtrees(volDoc, (e) => {
        const href = scrape.getAttr(e, "href");
        return href !== undefined && href.startsWith("/Volume_");
    });
    const vols = links.map((e) => scrape.getTextContent(e));

    // For each volume, retrieve the JSON.
    const baseURL =
        "http://floranorthamerica.org/Special:Ask/limit=5000/unescape=true/format=json";
    for (const vol of vols) {
        const fileName = path.join(toolsDataPath, `${vol}.json`);
        if (!Files.exists(fileName)) {
            const url = baseURL + `/-5B-5BVolume::${vol}-5D-5D`;
            await Files.fetch(url, fileName);
        }

        const text = Files.read(fileName);
        /** @type {{results:Object<string,{}>}} */
        const json = JSON.parse(text);
        const results = json.results;

        // If there are more than 5000 results, this will need to be updated to retrieve chunks.
        if (Object.entries(results).length >= 5000) {
            throw new Error(`${vol} has more than 5000 results`);
        }

        for (const [k] of Object.entries(results)) {
            fnaTaxa.set(k, { name: k });
        }
    }

    return fnaTaxa;
}

/**
 * @param {string} dataDir
 * @param {Map<string,string>} namesToUpdate
 */
function updateNames(dataDir, namesToUpdate) {
    const taxa = new TaxaCSV(dataDir);

    for (const taxonData of taxa.getTaxa()) {
        const newName = namesToUpdate.get(taxonData.taxon_name);
        if (!newName) {
            continue;
        }
        taxonData.fna = newName;
    }

    taxa.write();
}
