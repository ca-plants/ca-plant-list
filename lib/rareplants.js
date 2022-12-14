const RANK_DESCRIPS = {
    "1A": "Presumed Extirpated or Extinct",
    "1B": "Rare or Endangered",
    "2A": "Extirpated in California",
    "2B": "Rare or Endangered in California",
    "3": "Needs Review",
    "4": "Uncommon in California",
};

const THREAT_DESCRIPS = {
    "1": "Seriously threatened in California",
    "2": "Moderately threatened in California",
    "3": "Not very threatened in California",
};

const CESA_DESCRIPS = {
    "CC": "Candidate",
    "CE": "Endangered",
    "CR": "Rare",
    "CT": "Threatened",
};

class RarePlants {

    static getCESADescription( cesa ) {
        return CESA_DESCRIPS[ cesa ];
    }

    static getRPIRankDescription( rank ) {
        const pieces = rank.split( "." );
        return RANK_DESCRIPS[ pieces[ 0 ] ];
    }

    static getRPIRankAndThreatDescriptions( rank ) {
        const pieces = rank.split( "." );
        return [ RANK_DESCRIPS[ pieces[ 0 ] ], THREAT_DESCRIPS[ pieces[ 1 ] ] ];
    }

}

export { RarePlants };