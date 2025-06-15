/**
 * @import { Visitor, TokenOrValue, ReturnedDeclaration } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
export const PaddingVisitor = {
  Rule: {
    custom: {
      value(rule) {
        const [top, , right, , bottom, , left] =
          /** @type {Array<TokenOrValue>} */ (rule.prelude.value);

        return {
          type: "style",
          value: {
            loc: rule.loc,
            selectors: [[{ type: "nesting" }]],
            declarations: {
              declarations: expandPaddingIntoSeparateProperties(
                top,
                right,
                bottom,
                left,
              ),
            },
          },
        };
      },
    },
  },
};

/**
 * @param {TokenOrValue} top
 * @param {TokenOrValue} [right]
 * @param {TokenOrValue} [bottom]
 * @param {TokenOrValue} [left]
 * @returns {Array<ReturnedDeclaration>}
 */
function expandPaddingIntoSeparateProperties(
  top,
  right = top,
  bottom = top,
  left = right,
) {
  const paddingTop = generatePaddingProperty("top", top);
  const paddingRight = generatePaddingProperty("right", right);
  const paddingBottom = generatePaddingProperty("bottom", bottom);
  const paddingLeft = generatePaddingProperty("left", left);

  return [paddingTop, paddingRight, paddingBottom, paddingLeft].filter(
    (declaration) => {
      return declaration != null;
    },
  );
}

const SIDE_TO_PROPERTY = Object.freeze({
  top: CustomProperty.PaddingTop,
  right: CustomProperty.PaddingRight,
  bottom: CustomProperty.PaddingBottom,
  left: CustomProperty.PaddingLeft,
});

/**
 * @param {keyof typeof SIDE_TO_PROPERTY} side
 * @param {TokenOrValue} [token]
 * @returns {ReturnedDeclaration | null}
 */
function generatePaddingProperty(side, token) {
  if (token?.type === "token") {
    return {
      property: "custom",
      value: {
        name: SIDE_TO_PROPERTY[side],
        value: [token],
      },
    };
  }

  return null;
}
