/**
 * @param {unknown} value
 * @param {string} [truthyValue]
 * @returns {string | undefined}
 */
export function parseBooleanProperty(value, truthyValue = "") {
  return value === true || value === "true" || value === ""
    ? truthyValue
    : undefined;
}
