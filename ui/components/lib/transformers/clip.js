import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

const CLIP_RE = /\s*(?:(x|y)\s+)?(.+)\s*/;
const SCROLLABLE_KEYWORD_RE = /(?<!-)\bscrollable\b/g;

/**
 * @param {string} css
 * @returns {string}
 */
export function createClipProperties(css) {
  return css
    .replaceAll(
      PLACEHOLDER_RULE_WITH_VALUE_RE,
      /**
       * @param {string} _
       * @param {string} value
       */
      (_, value) => {
        const { x, y } = value.split(",").reduce(
          (accumulator, part) => {
            const [_, orientation, value] = CLIP_RE.exec(part) ?? [];

            if (orientation == null) {
              accumulator.x = value;
              accumulator.y = value;
            } else {
              accumulator[orientation] = value;
            }

            return accumulator;
          },
          /**
           * @type {Record<string, string | null>}
           */
          ({ x: null, y: null }),
        );

        let overflow = "";

        if (x != null) {
          overflow += `overflow-x: ${x};`;
        }

        if (y != null) {
          overflow += `overflow-y: ${y};`;
        }

        return overflow;
      },
    )
    .replaceAll(SCROLLABLE_KEYWORD_RE, "auto");
}
