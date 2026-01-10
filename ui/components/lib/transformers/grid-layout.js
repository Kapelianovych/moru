import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

/**
 * @param {string} css
 * @returns {string}
 */
export function createGridTemplateProperty(css) {
  return css.replaceAll(
    PLACEHOLDER_RULE_WITH_VALUE_RE,
    /**
     * @param {string} _
     * @param {string} value
     */
    (_, value) => {
      const [first, second] = value.split(",").map(
        /**
         * @param {string} part
         */
        (part) => {
          const [direction, amount] = part.trim().split(/\s+/g);

          return /** @type {const} */ ([direction, parseInt(amount)]);
        },
      );

      const columns =
        first[0] === "columns"
          ? first[1]
          : second?.[0] === "columns"
            ? second[1]
            : 12;
      const rows =
        first[0] === "rows" ? first[1] : second?.[0] === "rows" ? second[1] : 1;

      return `grid-template: repeat(${rows}, 1fr) / repeat(${columns}, 1fr);`;
    },
  );
}
