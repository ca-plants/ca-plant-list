/** @type {Object<string,string>} */
const RANK_DESCRIPS = {
    "1A": "Presumed Extirpated or Extinct",
    "1B": "Rare or Endangered",
    "2A": "Extirpated in California",
    "2B": "Rare or Endangered in California",
    3: "Needs Review",
    4: "Uncommon in California",
};

/** @type {Object<string,string>} */
const THREAT_DESCRIPS = {
    1: "Seriously threatened in California",
    2: "Moderately threatened in California",
    3: "Not very threatened in California",
};

/** @type {Object<string,string>} */
const CESA_DESCRIPS = {
    CC: "Candidate",
    CE: "Endangered",
    CR: "Rare",
    CT: "Threatened",
};

/** @type {Object<string,string>} */
const FESA_DESCRIPS = {
    FE: "Endangered",
    FT: "Threatened",
    PE: "Proposed Endangered",
    PT: "Proposed Threatened",
    FC: "Candidate",
    FD: "Delisted",
};

class RarePlants {
    /**
     * @param {string|undefined} cesa
     */
    static getCESADescription(cesa) {
        if (!cesa) {
            return "";
        }
        return CESA_DESCRIPS[cesa];
    }

    /**
     * @param {string|undefined} fesa
     */
    static getFESADescription(fesa) {
        if (!fesa) {
            return "";
        }
        return FESA_DESCRIPS[fesa];
    }

    /**
     * @param {string} rank
     */
    static getRPIRankDescription(rank) {
        const pieces = rank.split(".");
        return RANK_DESCRIPS[pieces[0]];
    }

    /**
     * @param {string} rank
     */
    static getRPIRankAndThreatDescriptions(rank) {
        const pieces = rank.split(".");
        return [RANK_DESCRIPS[pieces[0]], THREAT_DESCRIPS[pieces[1]]];
    }
}

export { RarePlants };
