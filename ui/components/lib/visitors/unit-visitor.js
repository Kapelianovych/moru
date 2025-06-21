/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/**
 * @type {Visitor<DefaultCustomAtRules>}
 */
export const UnitVisitor = {
  Token: {
    dimension(token) {
      switch (token.unit) {
        case "un":
          return {
            type: "function",
            value: {
              name: "calc",
              arguments: [
                {
                  type: "token",
                  value: {
                    type: "number",
                    value: token.value,
                  },
                },
                {
                  type: "token",
                  value: {
                    type: "delim",
                    value: "*",
                  },
                },
                {
                  type: "var",
                  value: {
                    name: {
                      ident: CustomProperty.MeasurementUnit,
                    },
                  },
                },
              ],
            },
          };
      }
    },
  },
};

/**
 * @type {Visitor<DefaultCustomAtRules>}
 */
export const MeasurementUnitVisitor = {
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
                    name: CustomProperty.MeasurementUnit,
                    value: preludeTokens,
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
