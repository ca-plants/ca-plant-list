import path from "node:path";
import xlsx from "exceljs";
import { Files } from "../files.js";
import { TaxaCSV } from "./taxacsv.js";
import { Taxon } from "../taxon.js";

export class Calscape {
    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../taxa.js").Taxa} taxa
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
        const calscapeData = await getCalscapeData(toolsDataDir);

        for (const taxon of taxa.getTaxonList()) {
            const taxonName = taxon.getName();
            const taxonCN = taxon.getCalscapeCommonName();
            const calscapeCN = getCalscapeCommonName(
                taxonName,
                calscapeData,
                exceptions,
            );

            if (taxonCN !== calscapeCN) {
                errorLog.log(
                    taxonName,
                    "name in Calscape data is different than taxa.csv",
                    calscapeCN ?? "undefined",
                    taxonCN ?? "undefined",
                );
            }
            // Calscape should only have natives, so make sure it's recorded as native.
            if (calscapeCN && !taxon.isCANative()) {
                errorLog.log(
                    taxonName,
                    "is in Calscape but not native in taxa.csv",
                );
            }
        }

        checkExceptions(taxa, exceptions, errorLog);

        if (update) {
            updateTaxaCSV(dataDir, calscapeData, exceptions);
        }
    }
}

/**
 * @param {import("../taxa.js").Taxa} taxa
 * @param {import("../exceptions.js").Exceptions} exceptions
 * @param {import("../errorlog.js").ErrorLog} errorLog
 */
function checkExceptions(taxa, exceptions, errorLog) {
    // Check the Calscape exceptions and make sure they still apply.
    for (const [name, v] of exceptions.getExceptions()) {
        const exceptions = v.calscape;
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
            errorLog.log(
                name,
                "has Calscape exceptions but not in Taxa collection",
            );
            continue;
        }

        for (const [k] of Object.entries(exceptions)) {
            switch (k) {
                case "notnative": {
                    if (taxon.isCANative()) {
                        errorLog.log(
                            name,
                            "has Calscape notnative exception but is native in taxa.csv",
                        );
                    }
                    break;
                }
                default:
                    errorLog.log(name, "unrecognized Calscape exception", k);
            }
        }
    }
}

/**
 * @param {string} taxonName
 * @param {Map<string,string>} calscapeData
 * @param {import("../exceptions.js").Exceptions} exceptions
 * @returns {string|undefined}
 */
function getCalscapeCommonName(taxonName, calscapeData, exceptions) {
    const calscapeCN = calscapeData.get(Taxon.getCalscapeName(taxonName));
    if (
        calscapeCN &&
        exceptions.hasException(taxonName, "calscape", "notnative")
    ) {
        return;
    }
    return calscapeCN;
}

/**
 * @param {string} toolsDataDir
 * @returns {Promise<Map<string,string>>}
 */
async function getCalscapeData(toolsDataDir) {
    /**
     * @param {import("exceljs").Cell} cell
     */
    function getCellValue(cell) {
        const value = cell.value;
        if (value === null || value === undefined) {
            return undefined;
        }
        return value.toString();
    }

    toolsDataDir = path.join(toolsDataDir, "calscape");
    Files.mkdir(toolsDataDir);
    await retrieveCalscapeFile(toolsDataDir);

    /** @type {Map<string,string>} */
    const data = new Map();

    const wb = new xlsx.Workbook();
    await wb.xlsx.readFile(getExcelFilename(toolsDataDir)).then(function () {
        const ws = wb.worksheets[0];
        let isInData = false;
        for (let index = 0; index < ws.rowCount; index++) {
            const row = ws.getRow(index);
            const col1 = getCellValue(row.getCell(1));
            if (!isInData) {
                if (col1 === "Botanical Name") {
                    isInData = true;
                }
                continue;
            }
            const col2 = getCellValue(row.getCell(2));
            if (!col1 || !col2) {
                continue;
            }
            data.set(col1, col2);
        }
    });

    return data;
}

/**
 * @param {string} toolsDataDir
 */
function getExcelFilename(toolsDataDir) {
    return path.join(toolsDataDir, "calscape.xlsx");
}

/**
 * @param {string} toolsDataDir
 */
async function retrieveCalscapeFile(toolsDataDir) {
    // Retrieve file if it's not there.
    const targetFile = getExcelFilename(toolsDataDir);
    if (Files.exists(targetFile)) {
        return;
    }
    console.info("retrieving " + targetFile);
    await Files.fetch("https://www.calscape.org/export/search/", targetFile);
}

/**
 * @param {string} dataDir
 * @param {Map<string,string>} calscapeData
 * @param {import("../exceptions.js").Exceptions} exceptions
 */
function updateTaxaCSV(dataDir, calscapeData, exceptions) {
    const taxa = new TaxaCSV(dataDir);

    for (const taxonData of taxa.getTaxa()) {
        const taxonCN = taxonData.calscape_cn;
        const calscapeCN = getCalscapeCommonName(
            taxonData.taxon_name,
            calscapeData,
            exceptions,
        );
        if (taxonCN !== calscapeCN) {
            if (calscapeCN === undefined) {
                delete taxonData.calscape_cn;
            } else {
                taxonData.calscape_cn = calscapeCN;
            }
        }
    }

    taxa.write();
}
