import { Class, CustomProperty } from "../constants.js";
import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

/**
 * @param {string} css
 * @returns {string}
 */
export function createAlignmentProperties(css) {
  return css.replaceAll(
    PLACEHOLDER_RULE_WITH_VALUE_RE,
    /**
     * @param {string} _
     * @param {string} value
     */
    (_, value) => {
      const { x, y } = getAxisValues(value);

      return `
        ${createAlignmentByAxisProperties("left", "right", "column", x)}
        ${createAlignmentByAxisProperties("top", "bottom", "row", y)}
      `.trim();
    },
  );
}

/**
 * @param {string} value
 */
function getAxisValues(value) {
  const [first, second] = value.split(",").map((value) => {
    return value.trim();
  });

  if (first === "center" && second == null) {
    return { x: "center", y: "center" };
  }

  const x =
    first === "left" || first === "right" || first === "center"
      ? first
      : second;
  const y = first === x ? second : first;

  return {
    x,
    y: y === "up" ? "top" : y === "down" ? "bottom" : y,
  };
}

/**
 * @param {string} start
 * @param {string} end
 * @param {'row' | 'column'} oppositeDirection
 * @param {string | null} value
 * @returns {string}
 */
function createAlignmentByAxisProperties(start, end, oppositeDirection, value) {
  const condition = `not style(${CustomProperty.Direction}: ${oppositeDirection})`;

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
}
