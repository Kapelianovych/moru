/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/**
 * @typedef {'initial' | 'hidden' | 'scrollable'} Clip
 */

/** @type {Readonly<Record<Clip, string>>} */
const ClipToOverflow = Object.freeze({
  scrollable: "auto",
  hidden: "hidden",
  initial: "initial",
});

/**
 * @param {string} propertyName
 * @returns {Visitor<DefaultCustomAtRules>}
 */
function createClipVisitor(propertyName) {
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
                      value: preludeTokens.map(convertClipTokenToOverflow),
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

export const VerticalClipVisitor = createClipVisitor(
  CustomProperty.VerticalClip,
);

export const HorizontalClipVisitor = createClipVisitor(
  CustomProperty.HorizontalClip,
);

/**
 * @param {TokenOrValue} token
 * @returns {TokenOrValue}
 */
function convertClipTokenToOverflow(token) {
  if (token.type === "token" && token.value.type === "ident") {
    return {
      type: "token",
      value: {
        type: "ident",
        value: ClipToOverflow[/** @type {Clip} */ (token.value.value)],
      },
    };
  } else {
    return token;
  }
}
