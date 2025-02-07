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
     * @param {import("./types.js").Taxon} taxon
     * @param {import("./config.js").Config} config
     * @returns {URL|undefined}
     */
    static getInatObsLink(taxon, config) {
        const iNatID = taxon.getINatID();
        if (!iNatID) {
            return;
        }

        const url = new URL(
            "https://www.inaturalist.org/observations?subview=map",
        );
        url.searchParams.set("taxon_id", iNatID);
        for (const p of ["place_id", "project_id"]) {
            const v = config.getConfigValue("inat", p);
            if (v) {
                url.searchParams.set(p, v);
            }
        }

        return url;
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
     * @param {import("./types.js").Taxonomy} taxon
     * @returns {URL|undefined}
     */
    static getJepsonRefLink(taxon) {
        const id = taxon.getJepsonID();
        if (!id) {
            return;
        }
        return new URL(
            "https://ucjeps.berkeley.edu/eflora/eflora_display.php?tid=" + id,
        );
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
