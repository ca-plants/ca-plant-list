class TextUtils {
    /**
     * @param {string} t
     */
    static ucFirst(t) {
        return t[0].toUpperCase() + t.substring(1);
    }
}

export { TextUtils };
