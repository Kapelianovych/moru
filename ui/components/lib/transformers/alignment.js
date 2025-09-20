import { Class, CustomProperty } from "../constants.js";
import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

/**
 * @param {string} start
 * @param {string} end
 * @returns {function(string): string}
 */
export function createAlignmentProperties(start, end) {
  const oppositeDirection = start === "left" ? "column" : "row";

  const condition = `not style(${CustomProperty.Direction}: ${oppositeDirection})`;

  return (css) => {
    return css.replaceAll(PLACEHOLDER_RULE_WITH_VALUE_RE, (_, value) => {
      let finalCss = "";

      if (value === "center") {
        finalCss = `
          margin-${start}: auto;
          margin-${end}: auto;

          @container ${condition} {
            & + .${Class.Element} {
              margin-${start}: 0;
            }
          }
        `;
      } else if (value === end) {
        finalCss = `
          margin-${start}: auto;

          @container ${condition} {
            & + .${Class.Element} {
              margin-${start}: 0;
            }
          }
        `;
      } else {
        finalCss = `
          @container ${condition} {
            .${Class.Element}:has(~ &) {
              margin-${start}: 0;
              margin-${end}: 0;
            }
          }
        `;
      }

      return finalCss;
    });
  };
}
