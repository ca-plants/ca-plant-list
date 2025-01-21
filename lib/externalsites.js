/** @typedef {{
    coords?: [number, number];
    project_id?: string;
    subview?: "grid" | "list" | "map";
    taxon_id?: string;
}} InatObsOptions */

class ExternalSites {
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
}

export { ExternalSites };
