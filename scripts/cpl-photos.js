#!/usr/bin/env node

import path from "path";
import { ErrorLog } from "../lib/errorlog.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxa.js";
import { getTaxonPhotos } from "../lib/utils/inat-tools.js";
import { existsSync } from "fs";
import { CSV } from "../lib/csv.js";

const PHOTO_FILE_NAME = "inattaxonphotos.csv";

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
    const currentTaxaPhotos = readPhotos();

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
    const headers = ["name", "id", "ext", "licenseCode", "attrName"];
    /** @type {string[][]} */
    const data = [];
    for (const taxonName of [...currentTaxaPhotos.keys()].sort()) {
        // @ts-ignore
        for (const photo of currentTaxaPhotos.get(taxonName)) {
            data.push([
                taxonName,
                photo.id,
                photo.ext,
                photo.licenseCode,
                photo.attrName ?? "",
            ]);
        }
    }

    CSV.writeFileArray(
        `${options.outputdir}/${PHOTO_FILE_NAME}`,
        data,
        headers,
    );
}

/**
 * @param {import("commander").OptionValues} options
 * @param {import("commander").OptionValues} commandOptions
 */
async function checkmissing(options, commandOptions) {
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
 * @returns {Map<string,InatPhotoInfo[]>}
 */
function readPhotos() {
    const photosFileName = `./data/${PHOTO_FILE_NAME}`;
    if (!existsSync(photosFileName)) {
        return new Map();
    }

    /** @type {Map<string,{id:string,ext:string,licenseCode:string,attrName:string}[]>} */
    const taxonPhotos = new Map();

    /** @type {InatCsvPhoto[]} */
    // @ts-ignore
    const csvPhotos = CSV.readFile(photosFileName);
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

const program = Program.getProgram();
program
    .command("checkmissing")
    .description("List taxa with less than the maximum number of photos")
    .option(
        "--minphotos <number>",
        "Minimum number of photos. Taxa with fewer than this number will be listed.",
    )
    .action((options) => checkmissing(program.opts(), options));
if (process.env.npm_package_name === "@ca-plant-list/ca-plant-list") {
    // Only allow updates in ca-plant-list.
    program
        .command("addmissing")
        .description("Add photos to taxa with fewer than the maximum")
        .action(() => addMissingPhotos(program.opts()));
}
program.option(
    "--loader <path>",
    "The path (relative to the current directory) of the JavaScript file containing the TaxaLoader class. If not provided, the default TaxaLoader will be used.",
);
await program.parseAsync();
