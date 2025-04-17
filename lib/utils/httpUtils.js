export class HttpUtils {
    /**
     * @param {URL|string} url
     * @returns {Promise<boolean>}
     */
    static async UrlExists(url) {
        const response = await fetch(url, { method: "HEAD" });
        return response.status === 200;
    }
}
