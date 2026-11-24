import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

const POSITION_VALUE_RE =
  /sticky\s+at\s+(top|left|right|bottom)(?:\s+with\s+(\w+))?(?:\s+on\s+(top|left|right|bottom))?|(above|below|on-right|on-left|in-front|behind-content)(?:\s+(stretched|align top|align left|align right|align bottom))?/;

/**
 * @param {string | null | undefined} position
 * @returns {boolean}
 */
export function isSticky(position) {
  return position?.includes("sticky") ?? false;
}

/**
 * @param {string} css
 * @returns {string}
 */
export function createPositionProperty(css) {
  return css.replaceAll(PLACEHOLDER_RULE_WITH_VALUE_RE, (_, value) => {
    const [
      _1,
      stickyFirst,
      stickyOffset = "0",
      stickySecond,
      staticPosition,
      staticAlignment = "stretched",
    ] = POSITION_VALUE_RE.exec(value) ?? [];

    /**
     * @type {string}
     */
    let css = `position: ${stickyFirst ? "sticky" : "absolute"};`;

    if (staticPosition) {
      css += coordinatesForStaticPosition(staticPosition, staticAlignment);
    } else {
      css += coordinatesForStickyPosition(
        stickyFirst,
        stickyOffset,
        stickySecond,
      );
    }

    return css;
  });
}

/**
 * @param {string} position
 * @param {string} alignment
 * @returns {string}
 */
function coordinatesForStaticPosition(position, alignment) {
  switch (position) {
    case "above":
      switch (alignment) {
        case "stretched":
          return `
            left: 0;
            right: 0;
            bottom: 100%;
          `;
        case "align left":
          return `
            left: 0;
            bottom: 100%;
          `;
        case "align right":
          return `
            right: 0;
            bottom: 100%;
          `;
        case "align top":
        case "align bottom":
        default:
          throw new Error(
            "Aligning on y axis for the above position is not allowed.",
          );
      }
    case "below":
      switch (alignment) {
        case "stretched":
          return `
            left: 0;
            right: 0;
            top: 100%;
          `;
        case "align left":
          return `
            left: 0;
            top: 100%;
          `;
        case "align right":
          return `
            right: 0;
            top: 100%;
          `;
        case "align top":
        case "align bottom":
        default:
          throw new Error(
            "Aligning on y axis for the below position is not allowed.",
          );
      }
    case "on-left":
      switch (alignment) {
        case "stretched":
          return `
            top: 0;
            bottom: 0;
            right: 100%;
          `;
        case "align top":
          return `
            top: 0;
            right: 100%;
          `;
        case "align bottom":
          return `
            bottom: 0;
            right: 100%;
          `;
        case "align left":
        case "align right":
        default:
          throw new Error(
            "Aligning on x axis for the on-left position is not allowed.",
          );
      }
    case "on-right":
      switch (alignment) {
        case "stretched":
          return `
            top: 0;
            bottom: 0;
            left: 100%;
          `;
        case "align top":
          return `
            top: 0;
            left: 100%;
          `;
        case "align bottom":
          return `
            bottom: 0;
            left: 100%;
          `;
        case "align left":
        case "align right":
        default:
          throw new Error(
            "Aligning on x axis for the on-right position is not allowed.",
          );
      }
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
 * @param {string} offset
 * @param {string | undefined} second
 * @returns {string}
 */
function coordinatesForStickyPosition(first, offset, second) {
  return `
    ${first}: ${offset};
    ${second ? `${second}: 0;` : ""}
  `;
}
