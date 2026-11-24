import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

/**
 * @param {string} css
 * @returns {string}
 */
export function createBorderProperty(css) {
  return css.replaceAll(
    PLACEHOLDER_RULE_WITH_VALUE_RE,
    /**
     * @param {string} _
     * @param {string} value
     */
    (_, value) => {
      const borders = value.split(",");
      switch (borders.length) {
        case 2:
          return `
            border-top: ${borders[0]};
            border-bottom: ${borders[0]};
            border-left: ${borders[1]};
            border-right: ${borders[1]};
          `;
        case 3:
          return `
            border-top: ${borders[0]};
            border-bottom: ${borders[2]};
            border-left: ${borders[1]};
            border-right: ${borders[1]};
          `;
        case 4:
          return `
            border-top: ${borders[0]};
            border-right: ${borders[1]};
            border-bottom: ${borders[2]};
            border-left: ${borders[3]};
          `;
        case 1:
        default:
          return `border: ${borders};`;
      }
    },
  );
}
