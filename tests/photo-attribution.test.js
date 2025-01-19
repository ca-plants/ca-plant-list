import { Photo } from "../lib/photo.js";

/**
 * @param {PhotoRights} rights
 * @param {string} rightsHolder
 * @param {string} expected
 */
function testAtt(rights, rightsHolder, expected) {
    it(expected, () => {
        const photo = new Photo(null, rightsHolder, rights);
        const result = photo.getAttribution();
        expect(result).toEqual(expected);
    });
}

testAtt("CC BY-NC", "S H", "(c) S H (CC BY-NC)");
testAtt("CC0", "", "CC0");
testAtt("CC0", "abc", "By abc (CC0)");
testAtt("CC BY", "", "(c) (CC BY)");
