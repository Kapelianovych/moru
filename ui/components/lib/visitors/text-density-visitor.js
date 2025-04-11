/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
export const TextDensityVisitor = {
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
                    name: CustomProperty.TextDensity,
                    value: preludeTokens.map(normaliseTextDensity),
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
function normaliseTextDensity(tokenOrValue) {
  if (tokenOrValue.type === "token") {
    if (tokenOrValue.value.type === "number") {
      tokenOrValue.value.value -= 1;
    } else if (tokenOrValue.value.type === "dimension") {
      tokenOrValue.value.value -= 1;
    }
  }

  return tokenOrValue;
}
