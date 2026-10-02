import { describe, expect, it } from "@jest/globals";
import { getInatObsLinkData } from "../lib/htmltaxon.js";
import { Families } from "../lib/taxonomy/families.js";
import { Taxon } from "../lib/taxonomy/taxon.js";
import { Genera } from "../lib/genera.js";
import { Config } from "../lib/config.js";

/**
 * @typedef {{
 * taxon_name?:string,
 * "inat id"?:string
 * }} MockTaxonData
 */
/**
 * @param {MockTaxonData} data
 * @param {Genera} genera
 * @returns {Taxon}
 */
function createTaxon(data, genera) {
    /** @type {import("../lib/index.js").TaxonData} */
    const td = {
        "jepson id": "",
        bloom_end: "",
        bloom_start: "",
        calrecnum: "",
        cch2_id: "",
        CESA: "",
        "common name": "",
        CRPR: "",
        FESA: "",
        fna: "",
        calipc: "",
        flower_color: "",
        GRank: "",
        "inat id": data["inat id"] ?? "",
        life_cycle: "",
        "RPI ID": "",
        SRank: "",
        status: "N",
        taxon_name: data.taxon_name ?? "",
    };
    return new Taxon(td, genera);
}

describe("getInatObsLinkData", () => {
    const tests = [
        {
            name: "Elymus glaucus subsp. glaucus",
            "inat id": "57171",
            expected: [
                {
                    label: "Genus Elymus",
                    href: "https://www.inaturalist.org/observations?subview=map&iconic_taxa=Plantae&taxon_name=Elymus&view=species",
                },
                {
                    label: "Elymus glaucus",
                    href: "https://www.inaturalist.org/observations?subview=map&iconic_taxa=Plantae&taxon_name=Elymus+glaucus",
                },
                {
                    label: "Elymus glaucus subsp. glaucus",
                    href: "https://www.inaturalist.org/observations?subview=map&iconic_taxa=Plantae&taxon_id=57171",
                },
            ],
        },
        {
            name: "Elymus multisetus",
            "inat id": "57171",
            expected: [
                {
                    label: "Genus Elymus",
                    href: "https://www.inaturalist.org/observations?subview=map&iconic_taxa=Plantae&taxon_name=Elymus&view=species",
                },
                {
                    label: "Elymus multisetus",
                    href: "https://www.inaturalist.org/observations?subview=map&iconic_taxa=Plantae&taxon_id=57171",
                },
            ],
        },
        {
            name: "Elymus ×gouldii",
            "inat id": "57171",
            expected: [
                {
                    label: "Genus Elymus",
                    href: "https://www.inaturalist.org/observations?subview=map&iconic_taxa=Plantae&taxon_name=Elymus&view=species",
                },
                {
                    label: "Elymus ×gouldii",
                    href: "https://www.inaturalist.org/observations?subview=map&iconic_taxa=Plantae&taxon_id=57171",
                },
            ],
        },
    ];

    const families = new Families();
    const genera = new Genera(families);
    const config = new Config("./tests/config");

    for (const test of tests) {
        it(test.name, () => {
            const taxon = createTaxon(
                { taxon_name: test.name, "inat id": test["inat id"] },
                genera,
            );
            const linkData = getInatObsLinkData(taxon, config);
            expect(linkData.length).toBe(test.expected.length);
            for (let index = 0; index < test.expected.length; index++) {
                const e = test.expected[index];
                const a = linkData[index];
                expect(a.label).toBe(e.label);
                expect(a.href).toBe(e.href);
            }
        });
    }
});
