#!/usr/bin/env node

import path from "path";
import { ErrorLog } from "../lib/errorlog.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxonomy/taxa.js";
import { getTaxonPhotos } from "../lib/utils/inat-tools.js";
import { existsSync } from "fs";
import { CSV } from "../lib/csv.js";
import { HttpUtils } from "../lib/utils/httpUtils.js";
import { ProgressMeter } from "../lib/progressmeter.js";
import { Photo } from "../lib/photo.js";

const OBS_PHOTO_FILE_NAME = "inatobsphotos.csv";
const TAXON_PHOTO_FILE_NAME = "inattaxonphotos.csv";

const OPT_LOADER = "loader";

const MAX_PHOTOS = 5;

/**
 * @param {import("commander").OptionValues} options
 */
async function addMissingPhotos(options) {
    const taxaMissingPhotos = [];

    const taxa = await getTaxa(options);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);

    for (const taxon of taxa.getTaxonList()) {
        const photos = taxon.getPhotos();
        if (photos.length < MAX_PHOTOS) {
            taxaMissingPhotos.push(taxon);
        }
    }

    const newPhotos = await getTaxonPhotos(taxaMissingPhotos);
    const csvFilePath = getPhotoFilePath(TAXON_PHOTO_FILE_NAME, options);
    const currentTaxaPhotos = readPhotos(csvFilePath);

    for (const [taxonName, photos] of newPhotos) {
        let currentPhotos = currentTaxaPhotos.get(taxonName);
        if (!currentPhotos) {
            currentPhotos = [];
            currentTaxaPhotos.set(taxonName, currentPhotos);
        }
        for (const photo of photos) {
            if (currentPhotos.length === MAX_PHOTOS) {
                break;
            }
            if (
                currentPhotos.some(
                    (currentPhoto) => currentPhoto.id === photo.id,
                )
            ) {
                continue;
            }
            currentPhotos.push(photo);
            errorLog.log("adding photo", taxonName, photo.id);
        }
    }

    errorLog.write();

    // Write updated photo file.
    writePhotos(csvFilePath, currentTaxaPhotos);
}

/**
 * @param {import("commander").OptionValues} options
 */
async function check(options) {
    const csvFilePath = getPhotoFilePath(TAXON_PHOTO_FILE_NAME, options);
    const taxa = await getTaxa(options);
    const csvPhotos = readPhotos(csvFilePath);
    const taxaPhotos = await getTaxonPhotos(taxa.getTaxonList());
    const csvNames = Array.from(csvPhotos.keys());

    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", false);

    const meter = new ProgressMeter("checking taxa photos", csvPhotos.size);
    let errors = 0;
    let counter = 0;

    for (const name of csvNames) {
        const taxon = taxa.getTaxon(name);
        if (taxon) {
            const csvTaxonPhotos = csvPhotos.get(name) ?? [];
            const iNatTaxonPhotos = taxaPhotos.get(name) ?? [];

            // Make sure each of the CSV photos is still referenced.
            /** @type {string[]} */
            const idsToDelete = [];
            for (const csvPhoto of csvTaxonPhotos) {
                const photoId = csvPhoto.id;
                const iNatPhoto = iNatTaxonPhotos.find(
                    (tp) => tp.id === photoId,
                );
                if (iNatPhoto) {
                    /**
                     * @param {"attrName"|"ext"|"licenseCode"} colName
                     * @param {string|undefined} csvVal
                     * @param {string|undefined} iNatVal
                     */
                    function checkCol(colName, csvVal, iNatVal) {
                        iNatVal = iNatVal ?? "";
                        if (csvVal !== iNatVal) {
                            errors++;
                            errorLog.log(
                                name,
                                `photo in CSV has different ${colName}`,
                                photoId,
                                csvVal,
                                iNatVal,
                            );
                            if (options.update) {
                                csvPhoto[colName] = iNatVal;
                            }
                        }
                    }
                    checkCol("attrName", csvPhoto.attrName, iNatPhoto.attrName);
                    checkCol("ext", csvPhoto.ext, iNatPhoto.ext);
                    checkCol(
                        "licenseCode",
                        csvPhoto.licenseCode,
                        iNatPhoto.licenseCode,
                    );
                } else {
                    if (options.update) {
                        idsToDelete.push(photoId);
                    }
                    errors++;
                    errorLog.log(
                        name,
                        `photo id ${photoId} not found in iNat taxon photos`,
                    );
                }
            }

            if (idsToDelete.length > 0) {
                csvPhotos.set(
                    name,
                    csvTaxonPhotos.filter((p) => !idsToDelete.includes(p.id)),
                );
            }
        } else {
            errors++;
            errorLog.log(name, "not found in taxa list");
        }
        counter++;
        meter.update(counter, {
            custom: ` | ${errors} errors | ${name}`,
        });
    }

    meter.stop();

    if (options.update) {
        writePhotos(csvFilePath, csvPhotos);
    }

    errorLog.write();
}

/**
 * @param {import("commander").OptionValues} options
 * @param {import("commander").OptionValues} commandOptions
 */
async function checkmax(options, commandOptions) {
    const taxa = await getTaxa(options);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);

    const minPhotos = commandOptions.minphotos;
    for (const taxon of taxa.getTaxonList()) {
        const photos = taxon.getPhotos();
        if (
            minPhotos === undefined
                ? photos.length !== MAX_PHOTOS
                : photos.length < minPhotos
        ) {
            errorLog.log(taxon.getName(), photos.length.toString());
        }
    }

    errorLog.write();
}

/**
 * @param {import("commander").OptionValues} options
 */
async function checkUrl(options) {
    checkUrlFile(TAXON_PHOTO_FILE_NAME, options);
}

/**
 * @param {string} fileName
 * @param {import("commander").OptionValues} options
 */
async function checkUrlFile(fileName, options) {
    /**
     * @param {string} name
     * @param {import("../lib/utils/inat-tools.js").InatPhotoInfo[]} photoList
     */
    async function checkTaxon(name, photoList) {
        const urls = photoList.map((p) =>
            HttpUtils.UrlExists(Photo.getUrl(p.id, p.ext)),
        );
        const resolved = await Promise.all(urls);
        for (let index = 0; index < resolved.length; index++) {
            if (!resolved[index]) {
                const id = photoList[index].id;
                errorLog.log(name, id);
                invalid.push({ name: name, id: id });
            }
        }
    }

    const invalid = [];

    const csvFilePath = getPhotoFilePath(fileName, options);
    const photos = readPhotos(csvFilePath);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", false);

    const meter = new ProgressMeter("checking taxa URLs", photos.size);
    let counter = 0;
    const names = Array.from(photos.keys());

    for (const name of names) {
        const photoList = photos.get(name);
        // @ts-ignore
        await checkTaxon(name, photoList);
        meter.update(++counter, {
            custom: ` | ${invalid.length} errors | ${name}`,
        });
    }
    meter.stop();

    errorLog.write();
}

/**
 * @param {string} fileName
 * @param {import("commander").OptionValues} options
 * @returns {string}
 */
function getPhotoFilePath(fileName, options) {
    return path.join(".", options.datadir, fileName);
}

/**
 * @param {import("commander").OptionValues} options
 * @return {Promise<Taxa>}
 */
async function getTaxa(options) {
    const errorLog = new ErrorLog(options.outputdir + "/errors.tsv", true);

    const loader = options[OPT_LOADER];
    let taxa;
    if (loader) {
        const taxaLoaderClass = await import("file:" + path.resolve(loader));
        taxa = await taxaLoaderClass.TaxaLoader.loadTaxa(options, errorLog);
    } else {
        taxa = new Taxa(
            Program.getIncludeList(options.datadir),
            errorLog,
            options.showFlowerErrors,
        );
    }

    errorLog.write();
    return taxa;
}

/**
 * @param {{outputdir:string,update:boolean}} options
 */
async function prune(options) {
    await pruneFile(TAXON_PHOTO_FILE_NAME, options);
    await pruneFile(OBS_PHOTO_FILE_NAME, options);
}

/**
 * @param {string} fileName
 * @param {{outputdir:string,update:boolean}} options
 */
async function pruneFile(fileName, options) {
    const taxa = await getTaxa(options);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);
    const csvFilePath = getPhotoFilePath(fileName, options);
    const currentTaxaPhotos = readPhotos(csvFilePath);

    const invalidNames = new Set();

    for (const name of currentTaxaPhotos.keys()) {
        const taxon = taxa.getTaxon(name);
        if (!taxon) {
            errorLog.log(name, `is in ${csvFilePath} but not in taxa list`);
            invalidNames.add(name);
        }
    }

    if (options.update) {
        for (const name of invalidNames) {
            currentTaxaPhotos.delete(name);
        }
        writePhotos(csvFilePath, currentTaxaPhotos);
    }

    errorLog.write();
}

/**
 * @param {string} csvFilePath
 * @returns {Map<string,import("../lib/utils/inat-tools.js").InatPhotoInfo[]>}
 */
function readPhotos(csvFilePath) {
    if (!existsSync(csvFilePath)) {
        return new Map();
    }

    /** @type {Map<string,{id:string,ext:string,licenseCode:string,attrName:string}[]>} */
    const taxonPhotos = new Map();

    /** @type {import("../lib/utils/inat-tools.js").InatCsvPhoto[]} */
    // @ts-ignore
    const csvPhotos = CSV.readFile(csvFilePath);
    for (const csvPhoto of csvPhotos) {
        const taxonName = csvPhoto.name;
        let photos = taxonPhotos.get(taxonName);
        if (!photos) {
            photos = [];
            taxonPhotos.set(taxonName, photos);
        }
        photos.push({
            id: csvPhoto.id.toString(),
            ext: csvPhoto.ext,
            licenseCode: csvPhoto.licenseCode,
            attrName: csvPhoto.attrName,
        });
    }

    return taxonPhotos;
}

/**
 * @param {string} filePath
 * @param {Map<string,import("../lib/utils/inat-tools.js").InatPhotoInfo[]>} currentPhotos
 */
function writePhotos(filePath, currentPhotos) {
    // Write updated photo file.
    const headers = ["name", "id", "ext", "licenseCode", "attrName"];
    /** @type {string[][]} */
    const data = [];
    for (const taxonName of [...currentPhotos.keys()].sort()) {
        // @ts-ignore - should always be defined at this point
        for (const photo of currentPhotos.get(taxonName)) {
            data.push([
                taxonName,
                photo.id,
                photo.ext,
                photo.licenseCode,
                photo.attrName ?? "",
            ]);
        }
    }

    CSV.writeFileArray(filePath, data, headers);
}

const program = Program.getProgram();
program
    .command("checkmax")
    .description("List taxa with less than the maximum number of photos")
    .option(
        "--minphotos <number>",
        "Minimum number of photos. Taxa with fewer than this number will be listed.",
    )
    .action((options) => checkmax(program.opts(), options));
program
    .command("checkurl")
    .description("Make sure URLs are valid")
    .action(() => checkUrl(program.opts()));
if (process.env.npm_package_name === "@ca-plant-list/ca-plant-list") {
    // Only allow updates in ca-plant-list.
    program
        .command("check")
        .description("Check taxa photos to ensure information is current.")
        .action(() => check(program.opts()));
    program
        .command("addmissing")
        .description("Add photos to taxa with fewer than the maximum")
        .action(() => addMissingPhotos(program.opts()));
    program
        .command("prune")
        .description("Remove photos without valid taxon names")
        .action(() => prune(program.opts()));
}
program.option(
    "--loader <path>",
    "The path (relative to the current directory) of the JavaScript file containing the TaxaLoader class. If not provided, the default TaxaLoader will be used.",
);
program.option("--update", "Update the file if possible.");
await program.parseAsync();
