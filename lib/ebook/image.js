class Image {

    #src;
    #credit;

    constructor( src, credit ) {
        this.#src = src;
        this.#credit = credit;
    }

    getCaption() {
        return this.#credit ? this.#credit : undefined;
    }

    getSrc() {
        return this.#src;
    }

}

export { Image };