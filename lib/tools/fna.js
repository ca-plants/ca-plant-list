import path from "node:path";
import { Files } from "../files.js";
import { scrape } from "@htmltools/scrape";

/**
 * @typedef {{name:string}} FNATaxon
 * @typedef {Map<string,FNATaxon>} FNATaxa
 */

export class FNA {
    /**
     * @param {string} toolsDataDir
     * @param {import("../taxa.js").Taxa} taxa
     */
    static async analyze(toolsDataDir, taxa) {
        const toolsDataPath = path.join(toolsDataDir, "fna");
        const fnaTaxa = await getFNATaxa(toolsDataPath);

        let count = 0;
        for (const taxon of taxa.getTaxonList()) {
            const name = taxon.getName();
            const fnaName = getFNAName(name, fnaTaxa);
            if (fnaName === undefined) {
                console.log(name);
                count++;
            }
        }

        console.log(`${count} missing`);
    }
}

/**
 * @param {string} name
 * @param {FNATaxa} fnaTaxa
 * @returns {string|undefined}
 */
function getFNAName(name, fnaTaxa) {
    if (fnaTaxa.has(name)) {
        return name;
    }

    // See if we can swap var./subsp. to find it.
    const parts = name.split(" ");
    if (parts.length === 4) {
        parts[2] = parts[2] === "var." ? "subsp." : "var.";
        name = parts.join(" ");
        if (fnaTaxa.has(name)) {
            return name;
        }
    }

    // If it's the nominate subsp/var, see if we can find the species.
    if (parts.length === 4 && parts[1] === parts[3]) {
        name = parts[0] + " " + parts[1];
        if (fnaTaxa.has(name)) {
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
        Files.fetch(
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
            Files.fetch(url, fileName);
        }

        const text = Files.read(fileName);
        /** @type {{results:Object<string,{}>}} */
        const json = JSON.parse(text);
        const results = json.results;
        for (const [k] of Object.entries(results)) {
            fnaTaxa.set(k, { name: k });
        }
    }

    return fnaTaxa;
}
