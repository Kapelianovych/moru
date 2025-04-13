/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
export const RoundedVisitor = {
  Token: {
    ident(token) {
      if (token.value === "full") {
        return {
          type: "token",
          value: {
            type: "dimension",
            value: 700,
            unit: "un",
          },
        };
      }
    },
  },
  Rule: {
    custom: {
      value(rule) {
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
                    name: CustomProperty.Rounded,
                    value: /** @type {Array<TokenOrValue>} */ (
                      rule.prelude.value
                    ),
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

/** @type {Visitor<DefaultCustomAtRules>} */
export const BorderVisitor = {
  Rule: {
    custom: {
      value(rule) {
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
                    name: CustomProperty.Border,
                    value: /** @type {Array<TokenOrValue>} */ (
                      rule.prelude.value
                    ),
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
