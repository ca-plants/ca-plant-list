import path from "node:path";
import { Files } from "../files.js";
import { scrape } from "@htmltools/scrape";

export class CCH2 {
    /**
     * @param {string} toolsDataDir
     * @param {import("../taxa.js").Taxa} taxa
     */
    static async analyze(toolsDataDir, taxa) {
        const toolsDataPath = path.join(toolsDataDir, "cch2");

        const cchTaxa = await getCCHTaxa(toolsDataPath);

        for (const taxon of taxa.getTaxonList()) {
            const name = taxon.getName();
            const cchTaxon = cchTaxa.get(name);
            if (!cchTaxon) {
                console.log(name + " not found");
                continue;
            }
        }
    }
}

/**
 * @param {string} toolsDataPath
 * @returns {Promise<Map<string,{id:string,native:boolean}>>}
 */
async function getCCHTaxa(toolsDataPath) {
    await retrieveFiles(toolsDataPath);

    const data = new Map();

    loadData(toolsDataPath, data, "native", true);
    loadData(toolsDataPath, data, "naturalized", false);
    return data;
}

/**
 * @param {string} toolsDataPath
 * @param {Map<string,{id:string,native:boolean}>} data
 * @param {string} suffix
 * @param {boolean} isNative
 */
function loadData(toolsDataPath, data, suffix, isNative) {
    const fileName = path.join(toolsDataPath, `cch-${suffix}.html`);
    const doc = scrape.parseFile(fileName);
    const taxonDivs = scrape.getSubtrees(
        doc,
        (e) => scrape.getAttr(e, "class") === "sciname-div",
    );
    for (const div of taxonDivs) {
        const taxonName = scrape.getTextContent(div);
        const url = scrape.getAttr(div.children[0], "href");
        if (!url) {
            throw new Error();
        }
        const searchParams = new URLSearchParams(url.split("?")[1]);
        const id = searchParams.get("taxon");
        if (!id) {
            throw new Error();
        }
        data.set(taxonName, { id: id, native: isNative });
    }
}

/**
 * @param {string} toolsDataPath
 */
async function retrieveFiles(toolsDataPath) {
    // Create data directory if it's not there.
    Files.mkdir(toolsDataPath);

    await retrieveFile(toolsDataPath, "74", "native");
    await retrieveFile(toolsDataPath, "75", "naturalized");
}

/**
 * @param {string} toolsDataPath
 * @param {string} clid
 * @param {string} suffix
 */
async function retrieveFile(toolsDataPath, clid, suffix) {
    const fileName = path.join(toolsDataPath, `cch-${suffix}.html`);
    if (Files.exists(fileName)) {
        return;
    }
    const url = new URL(
        "https://www.cch2.org/portal/ident/key.php?taxon=All+Species&sortby=1&dynclid=0&pid=3&rv=0.9",
    );
    url.searchParams.set("clid", clid);
    const response = await fetch(url, { method: "GET" });
    const content = await response.text();
    Files.write(fileName, content);
}
