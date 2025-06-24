#!/usr/bin/env node

import path from "path";
import { ErrorLog } from "../lib/errorlog.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxonomy/taxa.js";
import {
    convertToCSVPhoto,
    getObsPhotosForIds,
    getObsPhotosForTaxa,
    getTaxonPhotos,
} from "../lib/utils/inat-tools.js";
import { existsSync } from "fs";
import { CSV } from "../lib/csv.js";
import { HttpUtils } from "../lib/utils/httpUtils.js";
import { ProgressMeter } from "../lib/progressmeter.js";
import { Photo } from "../lib/photo.js";
import { Config } from "../lib/config.js";
import { chunk } from "../lib/util.js";

const OBS_PHOTO_FILE_NAME = "inatobsphotos.csv";
const TAXON_PHOTO_FILE_NAME = "inattaxonphotos.csv";

const OPT_LOADER = "loader";

const MAX_PHOTOS = 5;

/**
 * @param {import("commander").OptionValues} options
 * @param {import("commander").OptionValues} commandOptions
 */
async function addMissingPhotos(options, commandOptions) {
    const filesToUpdate = getFilesToUpdate(commandOptions);
    if (filesToUpdate.taxa) {
        await addMissingTaxonPhotos(options);
    }
    if (filesToUpdate.observations) {
        await addMissingObsPhotos(options, commandOptions, isLocal);
    }
}

/**
 * @param {import("commander").OptionValues} options
 * @param {import("commander").OptionValues} commandOptions
 * @param {boolean} isLocal
 */
async function addMissingObsPhotos(options, commandOptions, isLocal) {
    const taxaMissingPhotos = [];

    const taxa = await Taxa.loadTaxa(options);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);

    const csvFilePath = getPhotoFilePath(OBS_PHOTO_FILE_NAME, options);
    const currentObsPhotos = readPhotos(csvFilePath);

    for (const taxon of taxa.getTaxonList()) {
        const photos = currentObsPhotos.get(taxon.getName());
        if (!photos || photos.length < MAX_PHOTOS) {
            taxaMissingPhotos.push(taxon);
        }
    }

    /** @type {import("../lib/utils/inat-tools.js").ObsPhotoLocationOptions|undefined} */
    let locationOptions;
    if (isLocal) {
        locationOptions = {};
        const config = new Config(options.datadir);
        const placeId = config.getConfigValue("inat", "place_id");
        const projId = config.getConfigValue("inat", "project_id");
        if (!placeId && !projId) {
            throw new Error();
        }
        if (placeId) {
            locationOptions.place_id = placeId;
        }
        if (projId) {
            locationOptions.project_id = projId;
        }
    }

    const taxaToProcess = commandOptions.maxtaxa
        ? taxaMissingPhotos.slice(0, parseInt(commandOptions.maxtaxa))
        : taxaMissingPhotos;
    const newPhotos = await getObsPhotosForTaxa(taxaToProcess, locationOptions);

    for (const [taxonName, photos] of newPhotos) {
        let currentPhotos = currentObsPhotos.get(taxonName);
        if (!currentPhotos) {
            currentPhotos = [];
            currentObsPhotos.set(taxonName, currentPhotos);
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
    writePhotos(csvFilePath, currentObsPhotos, true);
}

/**
 * @param {import("commander").OptionValues} options
 */
async function addMissingTaxonPhotos(options) {
    const taxaMissingPhotos = [];

    const taxa = await getTaxa(options);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);

    const csvFilePath = getPhotoFilePath(TAXON_PHOTO_FILE_NAME, options);
    const currentTaxaPhotos = readPhotos(csvFilePath);

    for (const taxon of taxa.getTaxonList()) {
        const photos = currentTaxaPhotos.get(taxon.getName());
        if (!photos || photos.length < MAX_PHOTOS) {
            taxaMissingPhotos.push(taxon);
        }
    }

    const newPhotos = await getTaxonPhotos(taxaMissingPhotos);

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
 * @param {import("commander").OptionValues} commandOptions
 */
async function check(options, commandOptions) {
    const filesToUpdate = getFilesToUpdate(commandOptions);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", false);

    if (filesToUpdate.taxa) {
        await checkTaxaPhotos(options, errorLog);
    }
    if (filesToUpdate.observations) {
        await checkObsPhotos(options, errorLog);
    }

    errorLog.write();
}

/**
 * @param {import("commander").OptionValues} options
 * @param {ErrorLog} errorLog
 */
async function checkObsPhotos(options, errorLog) {
    const csvFilePath = getPhotoFilePath(OBS_PHOTO_FILE_NAME, options);
    const csvPhotos = readPhotos(csvFilePath);

    /** @type {Set<string>} */
    const obsIds = new Set();
    for (const taxonPhotos of csvPhotos.values()) {
        taxonPhotos.forEach((p) => {
            if (p.obsId) {
                obsIds.add(p.obsId);
            }
        });
    }

    // Load current photo info.
    const unbatched = Array.from(obsIds.values());
    const batches = chunk(unbatched, 40);

    /** @type {Map<string,{photo:import("../lib/utils/inat-tools.js").InatApiPhoto}[]>} */
    const photosById = new Map();

    const meter = new ProgressMeter(
        "retrieving current photo data",
        unbatched.length,
    );
    let count = 0;

    for (const batch of batches) {
        const obsPhotos = await getObsPhotosForIds(batch);
        if (obsPhotos instanceof Error) {
            throw obsPhotos;
        }
        for (const obs of obsPhotos) {
            photosById.set(obs.id.toString(), obs.observation_photos);
        }
        count += batch.length;
        meter.update(count);
    }

    meter.stop();

    // Check data against current info.
    const obsIdsToDelete = new Set();
    const photoIdsToDelete = new Set();
    let propErrorCount = 0;

    for (const [name, photos] of csvPhotos.entries()) {
        for (const photo of photos) {
            const obsId = photo.obsId;
            if (!obsId) {
                throw new Error(`no obsId in ${JSON.stringify(photo)}`);
            }
            const currentPhotos = photosById.get(obsId);
            if (!currentPhotos) {
                errorLog.log(name, "observation ID not found", obsId);
                obsIdsToDelete.add(obsId);
                continue;
            }

            const currentApiPhoto = currentPhotos.find(
                (p) => p.photo.id.toString() === photo.id,
            );
            const currentCsvData = currentApiPhoto
                ? convertToCSVPhoto(currentApiPhoto.photo)
                : undefined;
            2;
            if (currentCsvData) {
                propErrorCount += checkProperties(
                    name,
                    photo,
                    currentCsvData,
                    errorLog,
                    options.update,
                );
            } else {
                errorLog.log(name, "photo id not found", photo.id);
                photoIdsToDelete.add(photo.id);
            }
        }
    }

    console.info(
        `${obsIdsToDelete.size + photoIdsToDelete.size + propErrorCount} errors`,
    );

    if (options.update) {
        const updatedCsvPhotos = new Map();
        csvPhotos.forEach((photos, taxonName) => {
            updatedCsvPhotos.set(
                taxonName,
                photos.filter(
                    (p) =>
                        !obsIdsToDelete.has(p.obsId) &&
                        !photoIdsToDelete.has(p.id),
                ),
            );
        });
        writePhotos(csvFilePath, updatedCsvPhotos, true);
    }
}

/**
 * @param {import("commander").OptionValues} options
 * @param {ErrorLog} errorLog
 */
async function checkTaxaPhotos(options, errorLog) {
    const csvFilePath = getPhotoFilePath(TAXON_PHOTO_FILE_NAME, options);
    const csvPhotos = readPhotos(csvFilePath);
    const taxa = await getTaxa(options);
    const taxaPhotos = await getTaxonPhotos(taxa.getTaxonList());
    const csvNames = Array.from(csvPhotos.keys());

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
                    errors += checkProperties(
                        name,
                        csvPhoto,
                        iNatPhoto,
                        errorLog,
                        options.update,
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
 * @param {string} name
 * @param {import("../lib/utils/inat-tools.js").InatPhotoInfo} csvPhoto
 * @param {import("../lib/utils/inat-tools.js").InatPhotoInfo} iNatPhoto
 * @param {ErrorLog} errorLog
 * @param {boolean} update
 * @returns {number}
 */
function checkProperties(name, csvPhoto, iNatPhoto, errorLog, update) {
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
                csvPhoto.id,
                csvVal,
                iNatVal,
            );
            if (update) {
                // @ts-ignore
                csvPhoto[colName] = iNatVal;
            }
        }
    }
    let errors = 0;
    checkCol("attrName", csvPhoto.attrName ?? "", iNatPhoto.attrName ?? "");
    checkCol("ext", csvPhoto.ext, iNatPhoto.ext);
    checkCol("licenseCode", csvPhoto.licenseCode, iNatPhoto.licenseCode);
    return errors;
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
 * @param {import("commander").OptionValues} commandOptions
 * @return {{observations:boolean,taxa:boolean}}
 */
function getFilesToUpdate(commandOptions) {
    const isLocal =
        process.env.npm_package_name !== "@ca-plant-list/ca-plant-list";
    return {
        observations:
            isLocal || commandOptions.observations || !commandOptions.taxa,
        taxa: !isLocal && (commandOptions.taxa || !commandOptions.observations),
    };
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

    /** @type {Map<string,import("../lib/utils/inat-tools.js").InatPhotoInfo[]>} */
    const taxonPhotos = new Map();

    /** @type {import("../lib/utils/inat-tools.js").InatCsvPhoto[]} */
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
            obsId: csvPhoto.obsId,
            ext: csvPhoto.ext,
            licenseCode: csvPhoto.licenseCode,
            attrName: csvPhoto.attrName,
        });
    }

    return taxonPhotos;
}

/**
 * Write updated photo file.
 * @param {string} filePath
 * @param {Map<string,import("../lib/utils/inat-tools.js").InatPhotoInfo[]>} currentPhotos
 * @param {boolean} [includeObsId=false]
 */
function writePhotos(filePath, currentPhotos, includeObsId = false) {
    const headers = ["name", "id"];
    if (includeObsId) {
        headers.push("obsId");
    }
    headers.push("ext", "licenseCode", "attrName");

    /** @type {import("../lib/utils/inat-tools.js").InatCsvPhoto[]} */
    const data = [];
    for (const taxonName of [...currentPhotos.keys()].sort()) {
        // @ts-ignore - should always be defined at this point
        for (const photo of currentPhotos.get(taxonName)) {
            data.push({
                name: taxonName,
                id: photo.id,
                obsId: photo.obsId,
                ext: photo.ext,
                licenseCode: photo.licenseCode,
                attrName: photo.attrName ?? "",
            });
        }
    }

    CSV.writeFileObject(filePath, data, headers);
}

const isLocal = process.env.npm_package_name !== "@ca-plant-list/ca-plant-list";

const program = Program.getProgram();

const addMissingCommand = program.command("addmissing");
addMissingCommand
    .description("Add photos to taxa with fewer than the maximum")
    .action((options) => addMissingPhotos(program.opts(), options));
addMissingCommand.option(
    "--maxtaxa <number>",
    `Maximum number of taxa to process when updating ${OBS_PHOTO_FILE_NAME}.`,
);
if (!isLocal) {
    addMissingCommand.option(
        "--observations",
        `Update ${OBS_PHOTO_FILE_NAME}.`,
    );
    addMissingCommand.option("--taxa", `Update ${TAXON_PHOTO_FILE_NAME}.`);
}

const checkCommand = program.command("check");
checkCommand
    .description("Check photo data to ensure information is current")
    .action((options) => check(program.opts(), options));
if (!isLocal) {
    checkCommand.option("--observations", `Check ${OBS_PHOTO_FILE_NAME}`);
    checkCommand.option("--taxa", `Check ${TAXON_PHOTO_FILE_NAME}`);
}

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
if (!isLocal) {
    // Only allow updates in ca-plant-list.
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
