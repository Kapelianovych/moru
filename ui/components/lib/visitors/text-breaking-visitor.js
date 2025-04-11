/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/**
 * @typedef {"anywhere" | "forbid" | "prefer-newlines"} TextBreaking
 */

/** @type {Visitor<DefaultCustomAtRules>} */
export const TextBreakingVisitor = {
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
                    name: CustomProperty.TextWhiteSpace,
                    value: preludeTokens.map(normaliseWhiteSpaceValue),
                  },
                },
                {
                  property: "custom",
                  value: {
                    name: CustomProperty.TextOverflowWrap,
                    value: preludeTokens.map(normaliseOverflowWrapValue),
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
function normaliseWhiteSpaceValue(tokenOrValue) {
  if (tokenOrValue.type === "token" && tokenOrValue.value.type === "ident") {
    const breaking = /** @type {TextBreaking} */ (tokenOrValue.value.value);

    tokenOrValue.value.value =
      breaking === "forbid"
        ? "nowrap"
        : breaking === "prefer-newlines"
          ? "pre-line"
          : "initial";
  }

  return tokenOrValue;
}

/**
 * @param {TokenOrValue} tokenOrValue
 * @returns {TokenOrValue}
 */
function normaliseOverflowWrapValue(tokenOrValue) {
  if (tokenOrValue.type === "token" && tokenOrValue.value.type === "ident") {
    const breaking = /** @type {TextBreaking} */ (tokenOrValue.value.value);

    tokenOrValue.value.value =
      breaking === "anywhere" ? "break-word" : "initial";
  }

  return tokenOrValue;
}
