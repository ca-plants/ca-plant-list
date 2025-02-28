/**
 * Break an array into chunks of a desired size
 * https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_chunk
 * @param {any[]} input
 * @param {number} size
 * @returns {any[][]}
 */
export function chunk(input, size) {
    return input.reduce((arr, item, idx) => {
        return idx % size === 0
            ? [...arr, [item]]
            : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
}

/**
 * @param {number} time
 */
export async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
