import { CustomProperty } from "../constants.js";

const UNIT_VALUE_RE = /((?:\d+)?(?:\.\d+)?)un\b/g;

/**
 * @param {string} css
 * @returns {string}
 */
export function replaceUnit(css) {
  return css.replaceAll(UNIT_VALUE_RE, (_, number) => {
    const coefficient = number.startsWith(".") ? `0${number}` : number;

    return `calc(${coefficient} * var(${CustomProperty.MeasurementUnit}))`;
  });
}
