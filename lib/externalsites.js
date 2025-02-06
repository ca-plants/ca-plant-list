/** @typedef {{
    coords?: [number, number];
    project_id?: string;
    subview?: "grid" | "list" | "map";
    taxon_id?: string;
}} InatObsOptions */

export class ExternalSites {
    /**
     * @param {import("./types.js").Taxon} taxon
     * @returns {URL|undefined}
     */
    static getCalfloraRefLink(taxon) {
        const calfloraID = taxon.getCalfloraID();
        if (!calfloraID) {
            return;
        }
        return new URL("https://www.calflora.org/app/taxon?crn=" + calfloraID);
    }

    /**
     * @param {import("./types.js").Taxon} taxon
     * @returns {URL|undefined}
     */
    static getCalscapeLink(taxon) {
        const calscapeCN = taxon.getCalscapeCommonName();
        if (!calscapeCN) {
            return;
        }
        return new URL(
            `https://www.calscape.org/${taxon.getCalscapeName().replaceAll(" ", "-")}-()`,
        );
    }

    /**
     * @param {import("./types.js").Taxon} taxon
     * @param {import("./config.js").Config} config
     * @returns {URL|undefined}
     */
    static getCCH2ObsLink(taxon, config) {
        const url = new URL(
            "https://www.cch2.org/portal/collections/listtabledisplay.php?usethes=1&taxontype=2&sortfield1=o.eventDate&sortorder=desc",
        );
        url.searchParams.set("county", config.getCountyNames().join(";"));
        url.searchParams.set("taxa", taxon.getName());
        return url;
    }

    /**
     * @param {import("./types.js").Taxon} taxon
     * @returns {URL|undefined}
     */
    static getCCH2RefLink(taxon) {
        const id = taxon.getCCH2ID();
        if (!id) {
            return;
        }
        const url = new URL("https://www.cch2.org/portal/taxa/index.php");
        url.searchParams.set("taxon", id);
        return url;
    }

    /**
     * @param {import("./types.js").Taxon} taxon
     * @returns {URL|undefined}
     */
    static getFNARefLink(taxon) {
        const name = taxon.getFNAName();
        if (!name) {
            return;
        }
        const url = new URL(
            "http://floranorthamerica.org/" + name.replaceAll(" ", "_"),
        );
        return url;
    }

    /**
     * @param {InatObsOptions} options
     */
    static getInatObsLink(options) {
        const url = new URL(
            "https://www.inaturalist.org/observations?subview=map",
        );

        if (options.coords) {
            const delta = 0.1;
            const params = url.searchParams;
            const lat = options.coords[1];
            const lng = options.coords[0];
            params.set("nelat", (lat + delta).toString());
            params.set("swlat", (lat - delta).toString());
            params.set("nelng", (lng + delta).toString());
            params.set("swlng", (lng - delta).toString());
        }

        for (const [k, v] of Object.entries(options)) {
            switch (k) {
                case "created_d1":
                case "list_id":
                case "place_id":
                case "project_id":
                case "subview":
                case "taxon_id":
                case "taxon_name":
                    if (typeof v === "string") {
                        url.searchParams.set(k, v);
                    }
                    break;
            }
        }

        return url.toString();
    }

    /**
     * @param {import("./types.js").Taxon} taxon
     * @returns {URL|undefined}
     */
    static getINatRefLink(taxon) {
        const iNatID = taxon.getINatID();
        if (!iNatID) {
            return;
        }
        return new URL("https://www.inaturalist.org/taxa/" + iNatID);
    }

    /**
     * @param {import("./types.js").Taxon} taxon
     * @returns {URL|undefined}
     */
    static getRPIRefLink(taxon) {
        const rpiID = taxon.getRPIID();
        if (!rpiID) {
            return;
        }
        return new URL("https://rareplants.cnps.org/Plants/Details/" + rpiID);
    }
}
