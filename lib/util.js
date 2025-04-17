/**
 * Break an array into chunks of a desired size
 * https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_chunk
 * @template T
 * @param {T[]} input
 * @param {number} size
 * @returns {T[][]}
 */
export function chunk(input, size) {
    /** @type {T[][]} */
    const result = [];
    return input.reduce((arr, item, idx) => {
        return idx % size === 0
            ? [...arr, [item]]
            : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, result);
}

/**
 * @param {number} time
 */
export async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
