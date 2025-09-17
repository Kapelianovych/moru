/**
 * @param {string} value
 * @returns {string}
 */
export function toKebabCase(value) {
  return value
    .replace(/([A-Z](?:$|[a-z]))/g, "-$1")
    .replace(/--/g, "-")
    .replace(/^-|-$/, "")
    .toLowerCase();
}
