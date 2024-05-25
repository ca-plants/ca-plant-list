class ExternalSites {
    static getInatObsLink(options) {
        const url = new URL(
            "https://www.inaturalist.org/observations?subview=map"
        );

        for (const [k, v] of Object.entries(options)) {
            switch (k) {
                case "coords": {
                    const delta = 0.1;
                    const params = url.searchParams;
                    params.set("nelat", v[1] + delta);
                    params.set("swlat", v[1] - delta);
                    params.set("nelng", v[0] + delta);
                    params.set("swlng", v[0] - delta);
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
