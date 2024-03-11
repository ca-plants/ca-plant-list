const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

class DateUtils {
    /**
     * @param {number} monthNum Starting with 1 for January.
     * @returns {string}
     */
    static getMonthName(monthNum) {
        return MONTH_NAMES[monthNum - 1];
    }

    /**
     * @param {[number,number]} r1
     * @param {[number,number]} r2
     * @returns {boolean}
     */
    static monthRangesOverlap(r1, r2) {
        /**
         * @param {[number,number]} r1
         * @param {[number,number]} r2
         */
        function contains(r1, r2) {
            /**
             * @param {number} v
             * @param {[number,number]} r
             */
            function inRange(v, r) {
                return v >= r[0] && v <= r[1];
            }
            return inRange(r1[0], r2) || inRange(r1[1], r2);
        }

        // If ranges cross into next year, split them in 2.
        if (r1[0] > r1[1]) {
            return (
                this.monthRangesOverlap([r1[0], 12], r2) ||
                this.monthRangesOverlap([1, r1[1]], r2)
            );
        }
        if (r2[0] > r2[1]) {
            return (
                this.monthRangesOverlap(r1, [r2[0], 12]) ||
                this.monthRangesOverlap(r1, [1, r2[1]])
            );
        }
        return contains(r1, r2) || contains(r2, r1);
    }
}

export { DateUtils };
