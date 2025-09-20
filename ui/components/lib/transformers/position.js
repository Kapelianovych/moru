import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

const POSITION_VALUE_RE =
  /sticky\s+at\s+(top|left|right|bottom)(?:-(top|left|right|bottom))?|(above|below|on-right|on-left|in-front|behind-content)/;

/**
 * @param {string} css
 * @returns {string}
 */
export function createPositionProperty(css) {
  return css.replaceAll(PLACEHOLDER_RULE_WITH_VALUE_RE, (_, value) => {
    const [_1, stickyFirst, stickySecond, staticPosition] =
      POSITION_VALUE_RE.exec(value) ?? [];

    /**
     * @type {string}
     */
    let css = `position: ${stickyFirst ? "sticky" : "absolute"};`;

    if (staticPosition) {
      css += coordinatesForStaticPosition(staticPosition);
    } else {
      css += coordinatesForStickyPosition(stickyFirst, stickySecond);
    }

    return css;
  });
}

/**
 * @param {string} position
 * @returns {string}
 */
function coordinatesForStaticPosition(position) {
  switch (position) {
    case "above":
      return `
        left: 0;
        right: 0;
        bottom: 100%;
      `;
    case "below":
      return `
        left: 0;
        right: 0;
        top: 100%;
      `;
    case "on-left":
      return `
        right: 100%;
        top: 0;
        bottom: 0;
      `;
    case "on-right":
      return `
        left: 100%;
        top: 0;
        bottom: 0;
      `;
    case "behind-content":
      return `
       top: 0;
       left: 0;
       bottom: 0;
       right: 0;
       z-index: 0;
     `;
    case "in-front":
    default:
      return `
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 2;
      `;
  }
}

/**
 * @param {string} first
 * @param {string | undefined} second
 * @returns {string}
 */
function coordinatesForStickyPosition(first, second) {
  return `
    ${first}: 0;
    ${second ? `${second}: 0;` : ""}
  `;
}
