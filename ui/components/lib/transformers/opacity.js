import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

/**
 * @param {string} css
 * @returns {string}
 */
export function createOpacityProperty(css) {
  return css.replaceAll(PLACEHOLDER_RULE_WITH_VALUE_RE, (_, value) => {
    const opacityLevel = getOpacityLevel(value);

    return `opacity: ${opacityLevel};`;
  });
}

/**
 * @param {string} value
 * @returns {number | string}
 */
function getOpacityLevel(value) {
  switch (value) {
    case "transparent":
      return 0;
    case "semi-opaque":
    case "semi-transparent":
      return 0.5;
    case "opaque":
      return 1;
    default:
      return value;
  }
}
