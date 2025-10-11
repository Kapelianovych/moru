import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

const ROTATION_RE = /\s*(left|right|up|down|flip-left|flip-right)\s+(.+)\s*/;

/**
 * @type {Record<string, string>}
 */
const directionToAxis = {
  left: "z",
  right: "z",
  up: "x",
  down: "x",
  "flip-left": "y",
  "flip-right": "y",
};

/**
 * @param {string} css
 * @returns {string}
 */
export function createRotationProperty(css) {
  return css.replaceAll(
    PLACEHOLDER_RULE_WITH_VALUE_RE,
    /**
     * @param {string} _
     * @param {string} value
     */
    (_, value) => {
      const matches = ROTATION_RE.exec(value);

      if (matches == null) {
        return `rotate: ${value};`;
      }

      const [, direction, angle] = matches;

      const sign =
        direction === "left" || direction === "up" || direction === "flip-left"
          ? "-1"
          : "1";

      return `rotate: ${directionToAxis[direction]} calc(${sign} * ${angle});`;
    },
  );
}
