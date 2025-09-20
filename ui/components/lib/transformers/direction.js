import { CustomProperty } from "../constants.js";
import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

/**
 * @param {string} css
 * @returns {string}
 */
export function createDirectionProperty(css) {
  return css.replaceAll(PLACEHOLDER_RULE_WITH_VALUE_RE, (_, value) => {
    const finalValue = value === "true" ? "column" : "row";

    return `
      flex-direction: ${finalValue};
      ${CustomProperty.Direction}: ${finalValue};
    `;
  });
}
