import cliProgress from "cli-progress";

export class ProgressMeter {
    #meter;

    /**
     * @param {string} label
     * @param {number} total
     */
    constructor(label, total) {
        this.#meter = new cliProgress.SingleBar({
            format: `${label} {percentage}% | {value}/{total}{custom}`,
            hideCursor: true,
        });
        this.#meter.start(total, 0, { custom: "" });
    }

    stop() {
        this.#meter.stop();
    }

    /**
     * @param {number} current
     * @param {{ custom: string; }} [custom={ custom: "" }]
     */
    update(current, custom = { custom: "" }) {
        this.#meter.update(current, custom);
    }
}
