/**
 * @import { Visitor, TokenOrValue, ReturnedDeclaration } from "lightningcss";
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
        const [width, , style, , colour] = /** @type {Array<TokenOrValue>} */ (
          rule.prelude.value
        );

        return {
          type: "style",
          value: {
            loc: rule.loc,
            selectors: [[{ type: "nesting" }]],
            declarations: {
              declarations: expandBorderIntoSeparateProperties(
                width,
                style,
                colour,
              ),
            },
          },
        };
      },
    },
  },
};

/**
 * @type {Record<number, string>}
 */
const INDEX_TO_PROPERTY = Object.freeze({
  0: CustomProperty.BorderWidth,
  1: CustomProperty.BorderStyle,
  2: CustomProperty.BorderColour,
});

/**
 * @param {...TokenOrValue} tokens
 * @returns {Array<ReturnedDeclaration>}
 */
function expandBorderIntoSeparateProperties(...tokens) {
  return tokens.map((token, index) => {
    return {
      property: "custom",
      value: {
        name: INDEX_TO_PROPERTY[index],
        value: [token],
      },
    };
  });
}
