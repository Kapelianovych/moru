/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { composeVisitors } from "lightningcss";

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
const FillVisitor = {
  Token: {
    ident(token) {
      if (token.value === "fill") {
        return {
          type: "token",
          value: {
            type: "percentage",
            value: 1,
          },
        };
      }
    },
  },
};

/**
 * @param {string} customPropertyName
 * @returns {Visitor<DefaultCustomAtRules>}
 */
function createAreaVisitor(customPropertyName) {
  return {
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
                      name: customPropertyName,
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
}

/** @type {Visitor<DefaultCustomAtRules>} */
export const WidthVisitor = composeVisitors([
  FillVisitor,
  createAreaVisitor(CustomProperty.Width),
]);

/** @type {Visitor<DefaultCustomAtRules>} */
export const HeightVisitor = composeVisitors([
  FillVisitor,
  createAreaVisitor(CustomProperty.Height),
]);

/** @type {Visitor<DefaultCustomAtRules>} */
export const MinWidthVisitor = composeVisitors([
  FillVisitor,
  createAreaVisitor(CustomProperty.MinWidth),
]);

/** @type {Visitor<DefaultCustomAtRules>} */
export const MinHeightVisitor = composeVisitors([
  FillVisitor,
  createAreaVisitor(CustomProperty.MinHeight),
]);
