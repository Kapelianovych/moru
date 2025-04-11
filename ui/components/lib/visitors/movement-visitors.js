/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/**
 * @param {string} propertyName
 * @param {boolean} shouldNegateMovementValue
 * @returns {Visitor<DefaultCustomAtRules>}
 */
function createMovementVisitor(propertyName, shouldNegateMovementValue) {
  return {
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
                      name: propertyName,
                      value: preludeTokens.map((token) => {
                        if (shouldNegateMovementValue) {
                          return negateMovementValue(token);
                        } else {
                          return token;
                        }
                      }),
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
export const MoveLeftVisitor = createMovementVisitor(
  CustomProperty.HorizontalMovement,
  true,
);

/** @type {Visitor<DefaultCustomAtRules>} */
export const MoveRightVisitor = createMovementVisitor(
  CustomProperty.HorizontalMovement,
  false,
);

/** @type {Visitor<DefaultCustomAtRules>} */
export const MoveUpVisitor = createMovementVisitor(
  CustomProperty.VerticalMovement,
  true,
);

/** @type {Visitor<DefaultCustomAtRules>} */
export const MoveDownVisitor = createMovementVisitor(
  CustomProperty.VerticalMovement,
  false,
);

/**
 * @param {TokenOrValue} token
 * @returns {TokenOrValue}
 */
function negateMovementValue(token) {
  if (token.type === "length") {
    token.value.value *= -1;
  } else if (token.type === "token") {
    switch (token.value.type) {
      case "number":
      case "percentage":
      case "dimension":
        token.value.value *= -1;
        break;
      default: // Do nothing.
    }
  }

  return token;
}
