import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

/**
 * @param {string} css
 * @returns {string}
 */
export function createTextBreakingProperty(css) {
  return css.replaceAll(PLACEHOLDER_RULE_WITH_VALUE_RE, (_, value) => {
    return `
      white-space: ${createWhiteSpaceValue(value)};
      overflow-wrap: ${createOverflowWrap(value)};
    `;
  });
}

/**
 * @param {string} value
 */
function createWhiteSpaceValue(value) {
  return value === "forbid"
    ? "nowrap"
    : value === "prefer-newlines"
      ? "pre-line"
      : "initial";
}

/**
 * @param {string} value
 */
function createOverflowWrap(value) {
  return value === "anywhere" ? "break-word" : "initial";
}
