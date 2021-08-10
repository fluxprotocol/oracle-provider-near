/**
 * Safely parse json without throwing any errors
 *
 * @export
 * @param {string} str
 * @return {(object | null)}
 */
export function parseJson<T>(str: string): T | null {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}