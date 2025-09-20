/**
 * @param {string} value
 * @returns {string}
 */
export function createOverflowValue(value) {
  switch (value) {
    case "scrollable":
      return "auto";
    case "hidden":
      return "hidden";
    default:
      return "initial";
  }
}
