/**
 * @param {number | `${number}un`} value
 * @param {string} defaultCSSUnit
 * @returns {string}
 */
export function convertUnits(value, defaultCSSUnit) {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  return `${numericValue}${defaultCSSUnit}`;
}
