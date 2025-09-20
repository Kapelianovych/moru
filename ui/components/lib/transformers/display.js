/**
 * @param {string} value
 * @returns {string}
 */
export function createDisplayValue(value) {
  return value === "true" ? "none" : "inline-flex";
}
