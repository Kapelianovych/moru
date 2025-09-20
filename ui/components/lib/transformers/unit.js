import { CustomProperty } from "../constants.js";

const UNIT_VALUE_RE = /(\d+(?:\.\d+)?)un\b/g;

/**
 * @param {string} css
 * @returns {string}
 */
export function replaceUnit(css) {
  return css.replaceAll(
    UNIT_VALUE_RE,
    `calc($1 * var(${CustomProperty.MeasurementUnit}))`,
  );
}
