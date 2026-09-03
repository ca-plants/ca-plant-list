import path from "node:path";
import fs from "node:fs";
import { CSV } from "../csv.js";
import { Files } from "../files.js";
import { TaxaCSV } from "./taxacsv.js";
import { Browser } from "../utils/browser.js";

/**
 * @typedef {"CRPR"|"CESA"|"CNDDB"|"FESA"|"Global"} Rank
 * @typedef {Map<string,Map<Rank,string|undefined>>} RanksToUpdate
 */

export class RPI {
    /** @type {Object<string,Object<string,string>>} */
    static #rpiData = {};

    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../config.js").Config} config
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {boolean} update
     */
    static async analyze(
        toolsDataDir,
        dataDir,
        taxa,
        config,
        exceptions,
        errorLog,
        update,
    ) {
        /**
         * @param {string} name
         * @param {Rank} label
         * @param {string|undefined} rpiRank
         * @param {string|undefined} taxonRank
         * @param {RanksToUpdate} ranksToUpdate
         */
        function checkStatusMatch(
            name,
            label,
            rpiRank,
            taxonRank,
            ranksToUpdate,
        ) {
            if (rpiRank !== taxonRank) {
                errorLog.log(
                    name,
                    label +
                        " rank in taxa.csv is different than rank in " +
                        fileName,
                    String(taxonRank),
                    String(rpiRank),
                );
                let map = ranksToUpdate.get(name);
                if (map === undefined) {
                    map = new Map();
                    ranksToUpdate.set(name, map);
                }
                map.set(label, rpiRank);
            }
        }

        const toolsDataPath = toolsDataDir + "/rpi";
        const fileName = "rpi.csv";
        const filePath = toolsDataPath + "/" + fileName;

        // Create data directory if it's not there.
        Files.mkdir(toolsDataPath);

        // Download the data file if it doesn't exist.
        if (!Files.exists(filePath)) {
            console.log("retrieving " + filePath);

            const browser = await Browser.getInstance(true);
            const page = await browser.getBrowserPage();

            await page.goto(
                "https://rareplants.cnps.org/search?life=Vas&mode=results&form=simple",
            );

            const session = await browser.getSession(toolsDataPath);

            await page.locator("button ::-p-text(Export CSV)").click();

            const filename = await browser.waitUntilDownload(session);
            // Download file name is the guid; rename it.
            fs.renameSync(path.join(toolsDataPath, filename), filePath);

            await browser.close();
        }

        const countyCodes = config.getCountyCodes();
        const ignoreGlobalRank = config.getConfigValue("rpi", "ignoreglobal");
        const ignoreCNDDBRank = config.getConfigValue("rpi", "ignorecnddb");

        /** @type {RanksToUpdate} */
        const ranksToUpdate = new Map();

        const csv = CSV.readFile(path.join(toolsDataPath, fileName));
        for (const row of csv) {
            const rpiName = row["Scientific Name"].replace(" ssp.", " subsp.");
            const translatedName = exceptions.getValue(
                rpiName,
                "rpi",
                "translation",
            );
            this.#rpiData[rpiName] = row;
            const name = translatedName ? translatedName : rpiName;
            const rank = row["CA Rare Plant Rank"];
            const rawCESA = row["State List"];
            const rawFESA = row["Fed List"];
            const cesa = rawCESA === "None" ? "" : rawCESA;
            const fesa = rawFESA === "None" ? "" : rawFESA;
            const cnddb = row["State Rank"];
            const globalRank = row["Global Rank"];
            const taxon = taxa.getTaxon(name);

            const shouldBeInGeo = this.#shouldBeHere(row, countyCodes);

            if (shouldBeInGeo) {
                if (!taxon) {
                    if (cesa && countyCodes.length > 0) {
                        errorLog.log(
                            name,
                            "is CESA listed but not found in taxa.csv",
                            cesa,
                        );
                    }
                    if (this.#hasExceptions(name, exceptions, "notingeo")) {
                        continue;
                    }
                    if (
                        this.#hasExceptions(name, exceptions, "extirpated") &&
                        (rank === "1A" || rank === "2A")
                    ) {
                        // It is state ranked, but extirpated statewide, so we are not tracking it.
                        continue;
                    }
                    if (countyCodes.length > 0) {
                        errorLog.log(
                            name,
                            "in RPI but not found in taxa.csv",
                            rank,
                        );
                    }
                    continue;
                }
            } else {
                if (!taxon) {
                    // Not in taxa.csv, and also not in RPI for local counties, so ignore it.
                    continue;
                }
                if (
                    taxon.isNative() &&
                    !this.#hasExceptions(name, exceptions, "ingeo")
                ) {
                    // If it is a local native in taxa.csv, warn.
                    errorLog.log(
                        name,
                        "in taxa.csv but not in RPI for local counties",
                        rank,
                    );
                }
            }

            checkStatusMatch(
                name,
                "CRPR",
                rank,
                taxon.getRPIRankAndThreat(),
                ranksToUpdate,
            );
            checkStatusMatch(
                name,
                "CESA",
                cesa,
                taxon.getCESA(),
                ranksToUpdate,
            );
            checkStatusMatch(
                name,
                "FESA",
                fesa,
                taxon.getFESA(),
                ranksToUpdate,
            );
            if (!ignoreCNDDBRank) {
                checkStatusMatch(
                    name,
                    "CNDDB",
                    cnddb,
                    taxon.getCNDDBRank(),
                    ranksToUpdate,
                );
            }
            if (!ignoreGlobalRank) {
                checkStatusMatch(
                    name,
                    "Global",
                    globalRank,
                    taxon.getGlobalRank(),
                    ranksToUpdate,
                );
            }

            if (
                !taxon.isCANative() &&
                !this.#hasExceptions(name, exceptions, "non-native")
            ) {
                errorLog.log(name, "is in RPI but not native in taxa.csv");
            }
        }

        // Check all taxa to make sure they are consistent with RPI.
        for (const taxon of taxa.getTaxonList()) {
            const name = taxon.getName();
            if (taxon.getRPIRankAndThreat()) {
                const translatedName = exceptions.getValue(
                    name,
                    "rpi",
                    "translation-to-rpi",
                );
                // Make sure it is in RPI data.
                if (!this.#rpiData[translatedName ? translatedName : name]) {
                    errorLog.log(
                        name,
                        "has CRPR in taxa.csv but is not in " + fileName,
                    );
                }
            } else {
                // If it is not in RPI, it shouldn't have any of the other ranks.
                if (
                    taxon.getCESA() ||
                    taxon.getFESA() ||
                    taxon.getCNDDBRank() ||
                    taxon.getGlobalRank()
                ) {
                    errorLog.log(name, "has no CRPR but has other ranks");
                }
            }
        }

        this.#checkExceptions(taxa, config, exceptions, errorLog);

        if (update) {
            this.#updateRanks(dataDir, ranksToUpdate);
        }
    }

    /**
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../config.js").Config} config
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     */
    static #checkExceptions(taxa, config, exceptions, errorLog) {
        const countyCodes = config.getCountyCodes();

        // Check the RPI exceptions and make sure they still apply.
        for (const [name, v] of exceptions.getExceptions()) {
            const rpiExceptions = v.rpi;
            if (!rpiExceptions) {
                continue;
            }

            const translatedName = exceptions.getValue(
                name,
                "rpi",
                "translation",
            );

            const taxon = taxa.getTaxon(translatedName ? translatedName : name);

            // Make sure it is actually in RPI data.
            const rpiData = this.#rpiData[name];
            if (!rpiData) {
                // Ignore it if there is a "translation-to-rpi" entry.
                if (!rpiExceptions["translation-to-rpi"]) {
                    errorLog.log(
                        name,
                        "has rpi exception but is not in rpi.csv",
                    );
                }
            }

            for (const [k, v] of Object.entries(rpiExceptions)) {
                switch (k) {
                    case "extirpated": {
                        // Make sure the taxon is not in our list.
                        if (taxon) {
                            errorLog.log(
                                name,
                                "has rpi extirpated exception but is in taxa.csv",
                            );
                        }
                        // Make sure it has extirpated RPI status.
                        const rank = rpiData["CRPR"];
                        if (rank !== "1A" && rank !== "2A") {
                            errorLog.log(
                                name,
                                "has rpi extirpated exception rank is not 1A or 2A",
                            );
                        }
                        break;
                    }
                    case "ingeo":
                        // Make sure the taxon is in our list.
                        if (!taxon) {
                            errorLog.log(
                                name,
                                "has rpi ingeo exception but is not in taxa.csv",
                            );
                        }
                        // Make sure it is no listed in local area in RPI.
                        if (this.#shouldBeHere(rpiData, countyCodes)) {
                            errorLog.log(
                                name,
                                "has rpi ingeo exception but is listed in local counties in rpi.csv",
                            );
                        }
                        break;
                    case "non-native":
                        // Make sure the taxon is in our list.
                        if (!taxon) {
                            errorLog.log(
                                name,
                                "has rpi non-native exception but is not in taxa.csv",
                            );
                            continue;
                        }
                        // Make sure it is non-native in our list.
                        if (taxon.isCANative()) {
                            errorLog.log(
                                name,
                                "has rpi non-native exception but is native in local list",
                            );
                        }
                        break;
                    case "notingeo":
                        // Make sure the taxon is not in our list.
                        if (taxon) {
                            errorLog.log(
                                name,
                                "has rpi notingeo exception but is in taxa.csv",
                            );
                        }
                        // Make sure it is listed in local area in RPI.
                        if (!this.#shouldBeHere(rpiData, countyCodes)) {
                            errorLog.log(
                                name,
                                "has rpi notingeo exception but is not listed in local counties in rpi.csv",
                            );
                        }
                        break;
                    case "translation": {
                        // Make sure the translated name is in our list.
                        if (!taxon) {
                            errorLog.log(
                                name,
                                "has rpi translation exception, but target not found",
                            );
                        }
                        // Make sure there is a matching translation exception.
                        const translatedName = exceptions.getValue(
                            v,
                            "rpi",
                            "translation-to-rpi",
                        );
                        if (translatedName !== name) {
                            errorLog.log(
                                name,
                                "has rpi translation exception, but no reverse translation",
                            );
                        }
                        break;
                    }
                    case "translation-to-rpi": {
                        // Make sure there is a matching translation exception.
                        const translatedName = exceptions.getValue(
                            v,
                            "rpi",
                            "translation",
                        );
                        if (translatedName !== name) {
                            errorLog.log(
                                name,
                                "has rpi translation-to-rpi exception, but no reverse translation",
                            );
                        }
                        break;
                    }
                    default:
                        errorLog.log(name, "unrecognized rpi exception", k);
                }
            }
        }
    }

    /**
     * @param {string} name
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param  {...string} args
     */
    static #hasExceptions(name, exceptions, ...args) {
        for (const arg of args) {
            if (exceptions.hasException(name, "rpi", arg)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {Object<string,string>} row
     * @param {string[]} countyCodes
     */
    static #shouldBeHere(row, countyCodes) {
        if (countyCodes.length === 0) {
            return true;
        }

        const rpiCounties = row["Counties"];
        for (const countyCode of countyCodes) {
            if (rpiCounties.includes(countyCode)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {string} dataDir
     * @param {RanksToUpdate} ranksToUpdate
     */
    static #updateRanks(dataDir, ranksToUpdate) {
        const taxa = new TaxaCSV(dataDir);

        for (const taxonData of taxa.getTaxa()) {
            const ranks = ranksToUpdate.get(taxonData.taxon_name);
            if (!ranks) {
                continue;
            }
            for (const [k, v] of ranks.entries()) {
                switch (k) {
                    case "CNDDB":
                        taxonData["SRank"] = v ?? "";
                        break;
                    case "Global":
                        taxonData["GRank"] = v ?? "";
                        break;
                    default:
                        taxonData[k] = v ?? "";
                        break;
                }
            }
        }

        taxa.write();
    }
}
