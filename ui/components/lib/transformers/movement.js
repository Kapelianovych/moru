import { PLACEHOLDER_RULE_WITH_VALUE_RE } from "../compile-css.js";

const MOVEMENT_RE = /\s*(left|right|up|down|closer|f[au]rther)\s+(.+)\s*/;

/**
 * @type {Record<string, string>}
 */
const directionToAxis = {
  left: "x",
  right: "x",
  up: "y",
  down: "y",
  closer: "z",
  further: "z",
  farther: "z",
};

/**
 * @param {string} css
 * @returns {string}
 */
export function createMovementProperty(css) {
  return css.replaceAll(
    PLACEHOLDER_RULE_WITH_VALUE_RE,
    /**
     * @param {string} _
     * @param {string} value
     */
    (_, value) => {
      const { x, y, z } = value.split(",").reduce(
        (accumulator, part) => {
          const matches = MOVEMENT_RE.exec(part) ?? [];

          const [, direction, distance] = matches;

          const sign =
            direction === "left" ||
            direction === "up" ||
            direction === "further" ||
            direction === "farther"
              ? "-1"
              : "1";

          accumulator[directionToAxis[direction]] =
            `calc(${sign} * ${distance})`;

          return accumulator;
        },
        /**
         * @type {Record<string, string>}
         */
        ({
          x: "0rem",
          y: "0rem",
          z: "0rem",
        }),
      );

      return `translate: ${x} ${y} ${z};`;
    },
  );
}
