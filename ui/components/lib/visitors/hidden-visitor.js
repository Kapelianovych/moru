/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
export const HiddenVisitor = {
  Rule: {
    custom: {
      value(rule) {
        const [tokenOrValue] = /** @type {Array<TokenOrValue>} */ (
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
                    name: CustomProperty.Hidden,
                    value: [
                      {
                        type: "token",
                        value: {
                          type: "ident",
                          value: getDisplayValue(tokenOrValue),
                        },
                      },
                    ],
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
 * @param {TokenOrValue} token
 * @returns {string}
 */
function getDisplayValue(token) {
  if (token.type === "token" && token.value.type === "ident") {
    return token.value.value === "true" ? "none" : "inline-flex";
  }

  return "inline-flex";
}
