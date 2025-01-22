import { Photo } from "../lib/photo.js";

/**
 * @param {import("../lib/utils/inat-tools.js").InatLicenseCode} licenseCode
 * @param {string} rightsHolder
 * @param {string} expected
 */
function testAtt(licenseCode, rightsHolder, expected) {
    it(expected, () => {
        const photo = new Photo(0, "", licenseCode, rightsHolder);
        const result = photo.getAttribution();
        expect(result).toEqual(expected);
    });
}

testAtt("cc-by-nc", "S H", "(c) S H (CC BY-NC)");
testAtt("cc0", "", "CC0");
testAtt("cc0", "abc", "By abc (CC0)");
testAtt("cc-by", "", "(c) (CC BY)");
