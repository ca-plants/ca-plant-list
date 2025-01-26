import path from "node:path";
import { Files } from "../files.js";
import { scrape } from "@htmltools/scrape";

/**
 * @typedef {{id:string,native:boolean}} CCHTaxon
 * @typedef {Map<string,CCHTaxon>} CCHTaxa
 */

export class CCH2 {
    /**
     * @param {string} toolsDataDir
     * @param {import("../taxa.js").Taxa} taxa
     */
    static async analyze(toolsDataDir, taxa) {
        const toolsDataPath = path.join(toolsDataDir, "cch2");

        const cchTaxa = await getCCHTaxa(toolsDataPath);

        for (const taxon of taxa.getTaxonList()) {
            const cchTaxon = getCCHTaxon(taxon, cchTaxa);
            if (!cchTaxon) {
                console.log(taxon.getName() + " not found");
                continue;
            }
        }
    }
}

/**
 * @param {string} toolsDataPath
 * @returns {Promise<CCHTaxa>}
 */
async function getCCHTaxa(toolsDataPath) {
    await retrieveFiles(toolsDataPath);

    const data = new Map();

    const files = Files.getDirEntries(toolsDataPath);
    files.forEach((f) => {
        loadData(path.join(toolsDataPath, f), data, f.startsWith("75"));
    });

    return data;
}

/**
 * @param {import("../taxon.js").Taxon} taxon
 * @param {CCHTaxa} cchTaxa
 * @returns {CCHTaxon|undefined}
 */
function getCCHTaxon(taxon, cchTaxa) {
    const cchTaxon = getCCHTaxonForName(taxon.getName(), cchTaxa);
    if (cchTaxon) {
        return cchTaxon;
    }

    // See if we can match any synonyms.
    const synTaxa = [];
    const names = [];
    for (const synonym of taxon.getSynonyms()) {
        const cchTaxon = getCCHTaxonForName(synonym, cchTaxa);
        if (cchTaxon) {
            synTaxa.push(cchTaxon);
            names.push(synonym);
        }
    }

    switch (synTaxa.length) {
        case 0:
            return;
        case 1:
            return synTaxa[0];
    }
    throw new Error(
        `${taxon.getName()} has multiple synonymns: ${names.join(", ")}`,
    );
}

/**
 * @param {string} name
 * @param {CCHTaxa} cchTaxa
 * @returns {CCHTaxon|undefined}
 */
function getCCHTaxonForName(name, cchTaxa) {
    const cchTaxon = cchTaxa.get(name);
    if (cchTaxon) {
        return cchTaxon;
    }

    // See if the infraspecific is the same as the species name; if so, CCH ignores the infraspecific.
    const parts = name.split(" ");
    if (parts.length === 4 && parts[1] === parts[3]) {
        const cchTaxon = cchTaxa.get(parts[0] + " " + parts[1]);
        if (cchTaxon) {
            return cchTaxon;
        }
    }
}

/**
 * @param {string} fileName
 * @param {Map<string,{id:string,native:boolean}>} data
 * @param {boolean} isNative
 */
function loadData(fileName, data, isNative) {
    const doc = scrape.parseFile(fileName);
    const taxonDivs = scrape.getSubtrees(
        doc,
        (e) => scrape.getAttr(e, "class") === "taxon-div",
    );
    for (const div of taxonDivs) {
        const link = div.children[0];
        const taxonName = scrape.getTextContent(link).trim();
        const url = scrape.getAttr(link, "href");
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

    await retrieveFilesForClid(toolsDataPath, "74");
    await retrieveFilesForClid(toolsDataPath, "75");
}

/**
 * @param {string} toolsDataPath
 * @param {string} clid
 */
async function retrieveFilesForClid(toolsDataPath, clid) {
    // Retrieve the first page.
    await retrieveFile(toolsDataPath, clid, "1");

    // Parse the links and retrieve subsequent pages.
    const doc = scrape.parseFile(path.join(toolsDataPath, `${clid}-1.html`));
    const links = scrape.getSubtrees(doc, (e) => {
        const href = scrape.getAttr(e, "href");
        if (href === undefined) {
            return false;
        }
        return href.startsWith("checklist.php?pagenumber=");
    });

    /** @type {Set<string>} */
    const pages = new Set();
    links.forEach((e) => {
        const href = scrape.getAttr(e, "href");
        if (href === undefined) {
            throw new Error();
        }
        const params = new URLSearchParams(href.split("?")[1]);
        const pagenumber = params.get("pagenumber");
        if (pagenumber === null) {
            throw new Error();
        }
        pages.add(pagenumber);
    });

    pages.forEach((n) => retrieveFile(toolsDataPath, clid, n));
}

/**
 * @param {string} toolsDataPath
 * @param {string} clid
 * @param {string} page
 */
async function retrieveFile(toolsDataPath, clid, page) {
    const fileName = path.join(toolsDataPath, `${clid}-${page}.html`);
    if (Files.exists(fileName)) {
        return;
    }
    const url = new URL(
        "https://www.cch2.org/portal/checklists/checklist.php?dynclid=0&pid=3&searchsynonyms=1&showalphataxa=1&defaultoverride=1",
    );
    url.searchParams.set("clid", clid);
    url.searchParams.set("pagenumber", page);
    const response = await fetch(url, { method: "GET" });
    const content = await response.text();
    Files.write(fileName, content);
}
