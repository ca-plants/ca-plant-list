class ExternalSites {
    /**
     * @param {InatObsOptions} options
     */
    static getInatObsLink(options) {
        const url = new URL(
            "https://www.inaturalist.org/observations?subview=map"
        );

        for (const [k, v] of Object.entries(options)) {
            switch (k) {
                case "coords": {
                    const delta = 0.1;
                    const params = url.searchParams;
                    /** @type {number} */
                    const lat = v[1];
                    /** @type {number} */
                    const lng = v[0];
                    params.set("nelat", (lat + delta).toString());
                    params.set("swlat", (lat - delta).toString());
                    params.set("nelng", (lng + delta).toString());
                    params.set("swlng", (lng - delta).toString());
                    break;
                }
                case "created_d1":
                case "list_id":
                case "place_id":
                case "project_id":
                case "subview":
                case "taxon_id":
                case "taxon_name":
                    if (v) {
                        url.searchParams.set(k, v);
                    }
                    break;
            }
        }

        return url.toString();
    }
}

export { ExternalSites };
