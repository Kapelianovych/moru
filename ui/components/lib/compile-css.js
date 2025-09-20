import { replaceUnit } from "./transformers/unit.js";
import { replaceFillKeyword } from "./transformers/area.js";

const EXPLICIT_RULE_DEFINITION_RE = /@|{/;
export const PLACEHOLDER_RULE_WITH_VALUE_RE = /@value\s+(.+?)\s*;/g;

/**
 * @param {string | null | undefined | number | boolean} value
 * @param {function(string): string} transform
 * @returns {string}
 */
export function compileCss(value, transform) {
  if (value == null) {
    return "";
  }

  value = value === "" ? "true" : String(value);

  if (!EXPLICIT_RULE_DEFINITION_RE.test(value)) {
    value = `@value ${value};`;
  }

  return transform(replaceFillKeyword(replaceUnit(value)));
}

/**
 * @param {string} property
 * @param {function(string): string} [transformValue]
 * @returns {function(string): string}
 */
export function createSinglePropertyTransformer(
  property,
  transformValue = (value) => value,
) {
  return (css) => {
    return css.replaceAll(PLACEHOLDER_RULE_WITH_VALUE_RE, (_, value) => {
      return `${property}: ${transformValue(value)};`;
    });
  };
}
