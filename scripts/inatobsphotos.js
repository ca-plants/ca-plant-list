#!/usr/bin/env node

import fs from "fs";
import cliProgress from "cli-progress";
import { stringify } from "csv-stringify";
import path from "path";

import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxa.js";
import { sleep } from "../lib/util.js";

// While I'm guessing the products of this data will be non-commercial, it's
// not clear how they'll be licensed so the ShareAlike clause is out, and
// they'll probably be derivative works so the "No Derivatives" clause should
// be respected.
const ALLOWED_LICENSE_CODES = ["cc0", "cc-by", "cc-by-nc"];

const DEFAULT_FILENAME = "inatobsphotos.csv";

/**
 * @param {Taxon} taxon
 * @param {InatObsPhotosCommandLineOptions} options
 * @return {Promise<InatApiObservation[]>}
 */
async function fetchObservationsForTaxon(taxon, options) {
    const inatTaxonId = taxon.getINatID();
    if (!inatTaxonId) return [];
    let url =
        `https://api.inaturalist.org/v2/observations/?taxon_id=${inatTaxonId}` +
        "&photo_license=" +
        ALLOWED_LICENSE_CODES.join(",") +
        "&order=desc" +
        "&order_by=votes" +
        "&per_page=5" +
        "&fields=(observation_photos:(photo:(url:!t,attribution:!t,license_code:!t)))";
    if (typeof options.inatObsQuery === "string") {
        url += `&${options.inatObsQuery}`;
    }
    const resp = await fetch(url);
    if (!resp.ok) {
        const error = await resp.text();
        throw new Error(`Failed to fetch taxa from iNat: ${error}`);
    }
    const json = await resp.json();
    return json.results;
}

/**
 * @param {InatObsPhotosCommandLineOptions} options
 */
async function getObsPhotos(options) {
    console.log("[inatobsphotos.js] options", options);

    const taxa = await Taxa.loadTaxa(options);
    const targetTaxa = taxa.getTaxonList();

    const filename = path.join("data", options.filename || DEFAULT_FILENAME);
    const writableStream = fs.createWriteStream(filename);
    const columns = ["name", "id", "ext", "licenseCode", "attrName"];
    const stringifier = stringify({ header: true, columns: columns });
    stringifier.pipe(writableStream);
    const prog = new cliProgress.SingleBar({
        format: "Downloading [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
        etaBuffer: targetTaxa.length,
    });
    prog.setMaxListeners(100);
    prog.start(targetTaxa.length, 0);

    for (const taxon of targetTaxa) {
        prog.increment();
        const observations = await fetchObservationsForTaxon(taxon, options);
        // Just get the CC-licensed ones, 5 per taxon should be fine (max is 20 on iNat). Whether or not
        const photos = observations
            .map((obs) => obs.observation_photos.map((op) => op.photo))
            .flat()
            .filter((photo) =>
                ALLOWED_LICENSE_CODES.includes(photo.license_code),
            )
            .slice(0, 5);
        for (const photo of photos) {
            const row = [
                taxon.getName(),
                photo.id,
                String(photo.url).split(".").at(-1),
                // Need the license code to do attribution properly
                photo.license_code,
                // Photographers retain copyright for most CC licenses,
                // except CC0, so attribution is a bit different
                photo.attribution.match(/\(c\) (.*?),/)?.[1] ||
                    photo.attribution.match(/uploaded by (.*)/)?.[1],
            ];
            stringifier.write(row);
        }
        await sleep(1_100);
    }
    prog.stop();
}

const program = Program.getProgram();
program
    .action(getObsPhotos)
    .description("Write a CSV to datadir with iNaturalist observation photos")
    .option(
        "-q, --inat-obs-query <query>",
        "Additional iNat observations API query terms to add, e.g. place_id=1234&d1=2020-01-01",
    )
    .option(
        "-fn, --filename <filename>",
        "Name of file to write to the data dir",
        DEFAULT_FILENAME,
    );

await program.parseAsync();
