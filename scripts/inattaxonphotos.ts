#!/usr/bin/env node

import fs from "fs";
import cliProgress from "cli-progress";
import { stringify } from "csv-stringify";
import path from "path";

import { ErrorLog } from "../lib/errorlog.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxa.js";
import { chunk, sleep } from "../lib/util.ts";

// While I'm guessing the products of this data will be non-commercial, it's
// not clear how they'll be licensed so the ShareAlike clause is out, and
// they'll probably be derivative works so the "No Derivatives" clause should
// be respected.
const ALLOWED_LICENSE_CODES = [
    "cc0", "cc-by", "cc-by-nc"
];

interface InatApiTaxon {
    id: number;
    taxon_photos: {
        photo: {
            attribution: string;
            id: number;
            license_code: string;
            medium_url: string;
        }
    }[];
}

async function getTaxonPhotos( options: CommandLineOptions ) {
    const errorLog = new ErrorLog(options.outputdir + "/errors.tsv");
    const taxa = new Taxa(
        Program.getIncludeList(options.datadir),
        errorLog,
        false
    );
    const targetTaxa = taxa.getTaxonList( );

    const filename = path.join( "data", "inattaxonphotos.csv" );
    const writableStream = fs.createWriteStream( filename );
    const columns = [
        "name",
        "id",
        "ext",
        "licenseCode",
        "attrName",
    ];
    const stringifier = stringify( { header: true, columns: columns } );
    stringifier.pipe(writableStream);
    const prog = new cliProgress.SingleBar({
        format: "Downloading [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
        etaBuffer: targetTaxa.length
    });
    prog.setMaxListeners( 100 );
    prog.start( targetTaxa.length, 0 );

    // Fetch endpoint can load multiple taxa, but it will created some long URLs so best to keep this smallish
    for ( const batch of chunk( targetTaxa, 30 ) ) {
        const inatTaxonIDs = batch.map( ( taxon: Taxon ) => taxon.getINatID( ) ).filter( Boolean );
        const url = `https://api.inaturalist.org/v2/taxa/${inatTaxonIDs.join( "," )}?fields=(taxon_photos:(photo:(medium_url:!t,attribution:!t,license_code:!t)))`;
        const resp = await fetch( url );
        if (!resp.ok) {
            const error = await resp.text();
            throw new Error(`Failed to fetch taxa from iNat: ${error}`);
        }
        const json = await resp.json();
        for ( const taxon of batch ) {
            prog.increment( );
            const iNatTaxon: InatApiTaxon = json.results.find( ( result: InatApiTaxon ) => result.id === Number( taxon.getINatID() ) );
            if ( !iNatTaxon ) continue;
            // Just get the CC-licensed ones, 5 per taxon should be fine (max is 20 on iNat). Whether or not 
            const taxonPhotos = iNatTaxon.taxon_photos
                .filter( tp => ALLOWED_LICENSE_CODES.includes( tp.photo.license_code ) )
                .slice( 0, 5 );

            for ( const taxonPhoto of taxonPhotos ) {
                const row = [
                    taxon.getName(),
                    taxonPhoto.photo.id,
                    taxonPhoto.photo.medium_url.split( "." ).at( -1 ),
                    // Need the license code to do attribution properly
                    taxonPhoto.photo.license_code,
                    // Photographers retain copyright for most CC licenses,
                    // except CC0, so attribution is a bit different
                    (
                        taxonPhoto.photo.attribution.match( /\(c\) (.*?),/ )?.[1]
                        || taxonPhoto.photo.attribution.match( /uploaded by (.*)/ )?.[1]
                    )
                ];
                stringifier.write( row );
            }
        }
        // iNat will throttle you if you make more than 1 request a second.
        // See https://www.inaturalist.org/pages/api+recommended+practices
        await sleep( 1_100 );
    }
    prog.stop();
}

const program = Program.getProgram();
program.action(getTaxonPhotos).description( "Write a CSV to datadir with iNaturalist taxon photos" );

await program.parseAsync();
