/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
export const TextLinesVisitor = {
  Rule: {
    custom: {
      value(rule) {
        const preludeTokens = /** @type {Array<TokenOrValue>} */ (
          rule.prelude.value
        );

        return {
          type: "style",
          value: {
            loc: rule.loc,
            selectors: [[{ type: "nesting" }]],
            declarations: {
              declarations: [
                {
                  property: "custom",
                  value: {
                    name: CustomProperty.TextLines,
                    value: preludeTokens.map(convertToUnits),
                  },
                },
              ],
            },
          },
        };
      },
    },
  },
};

/**
 * @param {TokenOrValue} tokenOrValue
 * @returns {TokenOrValue}
 */
function convertToUnits(tokenOrValue) {
  if (tokenOrValue.type === "token" && tokenOrValue.value.type === "number") {
    return {
      type: "token",
      value: {
        type: "dimension",
        value: tokenOrValue.value.value,
        unit: "un",
      },
    };
  } else {
    return tokenOrValue;
  }
}
