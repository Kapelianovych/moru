import { CustomProperty } from "./lib/names.js";

/**
 * @param {number | `${number}un`} value
 * @returns {string}
 */
export function convertUnits(value) {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  return `calc(${numericValue} * var(${CustomProperty.MeasurementUnit}))`;
}
