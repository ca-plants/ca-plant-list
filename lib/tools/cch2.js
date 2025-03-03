import path from "node:path";
import { renameSync } from "node:fs";
import puppeteer from "puppeteer";
import { CSV } from "../csv.js";
import { TaxaCSV } from "./taxacsv.js";
import { Files } from "../files.js";

/**
 * @typedef {{id:string}} CCHTaxon
 * @typedef {Map<string,CCHTaxon>} CCHTaxa
 */

export class CCH2 {
    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {boolean} update
     */
    static async analyze(
        toolsDataDir,
        dataDir,
        exceptions,
        taxa,
        errorLog,
        update,
    ) {
        const toolsDataPath = path.join(toolsDataDir, "cch2");

        const cchTaxa = await getCCHTaxa(toolsDataPath);

        const idsToUpdate = new Map();
        for (const taxon of taxa.getTaxonList()) {
            const name = taxon.getName();
            const cchTaxon = getCCHTaxon(taxon, cchTaxa);
            if (!cchTaxon) {
                if (!exceptions.hasException(name, "cch", "notincch")) {
                    errorLog.log(name, "not found in CCH data");
                }
                continue;
            }
            if (cchTaxon.id !== taxon.getCCH2ID()) {
                errorLog.log(
                    name,
                    "id in CCH data does not match id in taxa.csv",
                    cchTaxon.id,
                    taxon.getCCH2ID(),
                );
                idsToUpdate.set(name, cchTaxon.id);
            }
        }

        this.#checkExceptions(exceptions, taxa, errorLog, cchTaxa);

        if (update) {
            updateTaxaCSV(dataDir, idsToUpdate);
        }
    }

    /**
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {CCHTaxa} cchTaxa
     */
    static #checkExceptions(exceptions, taxa, errorLog, cchTaxa) {
        // Check the CCH exceptions and make sure they still apply.
        for (const [name, v] of exceptions.getExceptions()) {
            const exceptions = v.cch;
            if (!exceptions) {
                continue;
            }

            // Make sure the taxon is still in our list.
            const taxon = taxa.getTaxon(name);
            if (!taxon) {
                // Don't process global exceptions if taxon is not in local list.
                if (taxa.isSubset() && !v.local) {
                    continue;
                }
                errorLog.log(name, "has CCH exceptions but is not in taxa.tsv");
                continue;
            }

            for (const [k] of Object.entries(exceptions)) {
                const jepsonData = cchTaxa.get(name);
                switch (k) {
                    case "notincch":
                        // Make sure it is really not in CCH data.
                        if (jepsonData) {
                            errorLog.log(
                                name,
                                "has CCH notincch exception but is in CCH data",
                            );
                        }
                        break;
                    default:
                        errorLog.log(name, "unrecognized CCH exception", k);
                }
            }
        }
    }
}

/**
 * @param {string} toolsDataPath
 * @returns {Promise<CCHTaxa>}
 */
async function getCCHTaxa(toolsDataPath) {
    /**
     * @param {{taxonID:string,scientificName:string,rankID:string,acceptance:"0"|"1",acceptedTaxonID:string,acceptedScientificName:string}} record
     */
    function callback(record) {
        if (parseInt(record.rankID) < 220) {
            // Ignore ranks above species.
            return;
        }
        cchTaxa.set(record.scientificName, { id: record.taxonID });
    }

    const fileName = path.join(toolsDataPath, "taxa.csv");
    if (!Files.exists(fileName)) {
        await retrieveDataFile(toolsDataPath);
    }

    const cchTaxa = new Map();

    await CSV.parseFileStream(fileName, callback);

    return cchTaxa;
}

/**
 * @param {import("../types.js").Taxon} taxon
 * @param {CCHTaxa} cchTaxa
 * @returns {CCHTaxon|undefined}
 */
function getCCHTaxon(taxon, cchTaxa) {
    /**
     * @param {string} name
     */
    function getTaxon(name) {
        return cchTaxa.get(name);
    }

    const name = taxon.getName();
    const cchTaxon = getTaxon(name);
    if (cchTaxon) {
        return cchTaxon;
    }

    // No reference for the current name; try synonyms and see if any of them work.
    for (const synonym of taxon.getSynonyms()) {
        const cchTaxon = getTaxon(synonym);
        if (cchTaxon) {
            return cchTaxon;
        }
    }
}

/**
 * @param {string} toolsDataPath
 */
async function retrieveDataFile(toolsDataPath) {
    const url =
        "https://www.cch2.org/portal/taxa/taxonomy/taxonomydynamicdisplay.php";
    console.log(`retrieving file from ${url}`);

    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();

    await page.goto(url);
    await page.locator("#taxontarget").fill("Tracheophyta");

    // See https://stackoverflow.com/questions/53471235/how-to-wait-for-all-downloads-to-complete-with-puppeteer
    const session = await browser.target().createCDPSession();
    await session.send("Browser.setDownloadBehavior", {
        behavior: "allowAndName",
        downloadPath: path.resolve(toolsDataPath),
        eventsEnabled: true,
    });

    await page.locator('button[value="exportTaxonTree"]').click();

    const filename = await waitUntilDownload(session);
    // Download file name is the guid; rename it to taxa.csv.
    renameSync(
        path.join(toolsDataPath, filename),
        path.join(toolsDataPath, "taxa.csv"),
    );

    await browser.close();
}

/**
 * @param {string} dataDir
 * @param {Map<string,string>} idsToUpdate
 */
function updateTaxaCSV(dataDir, idsToUpdate) {
    const taxa = new TaxaCSV(dataDir);

    for (const taxonData of taxa.getTaxa()) {
        const id = idsToUpdate.get(taxonData.taxon_name);
        if (!id) {
            continue;
        }
        taxonData.cch2_id = id;
    }

    taxa.write();
}

/**
 * @param {import("puppeteer").CDPSession} session
 * @returns {Promise<string>}
 * @see https://stackoverflow.com/questions/53471235/how-to-wait-for-all-downloads-to-complete-with-puppeteer
 * @see https://scrapeops.io/puppeteer-web-scraping-playbook/nodejs-puppeteer-downloading-a-file/#setting-a-custom-download-behaviour
 */
async function waitUntilDownload(session) {
    return new Promise((resolve, reject) => {
        session.on("Browser.downloadProgress", (e) => {
            if (e.state === "completed") {
                resolve(e.guid);
            } else if (e.state === "canceled") {
                reject();
            }
        });
    });
}
