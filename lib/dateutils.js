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

    static getMonthName( monthNum ) {
        return MONTH_NAMES[ monthNum ];
    }

}

export { DateUtils };