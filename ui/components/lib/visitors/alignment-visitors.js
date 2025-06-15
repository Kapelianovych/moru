/**
 * @import {
 *  Token,
 *  Visitor,
 *  ReturnedRule,
 *  TokenOrValue,
 *  ParsedComponent,
 *  ReturnedDeclaration,
 * } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { Class, CustomProperty } from "../names.js";

/**
 * @typedef {'left' | 'center' | 'right'} HorizontalAlignment
 */

/**
 * @typedef {'top' | 'center' | 'bottom'} VerticalAlignment
 */

/**
 * @typedef {HorizontalAlignment | VerticalAlignment} Alignment
 */

/**
 * @private
 * @typedef {'top' | 'right' | 'bottom' | 'left'} AlignmentSide
 */

const AlignmentCustomProperty = Object.freeze({
  x: CustomProperty.HorizontalAlignment,
  y: CustomProperty.VerticalAlignment,
});

const StartAlignmentKeyword = Object.freeze({
  x: "left",
  y: "top",
});

const EndAlignmentKeyword = Object.freeze({
  x: "right",
  y: "bottom",
});

/** @type {Readonly<Record<Alignment, 'start' | 'center' | 'end'>>} */
const AlignmentToFlex = Object.freeze({
  left: "start",
  right: "end",
  center: "center",
  top: "start",
  bottom: "end",
});

/** @type {Token} */
const ZERO_NUMBER_TOKEN = {
  type: "number",
  value: 0,
};

/** @type {Token} */
const AUTO_IDENT_TOKEN = {
  type: "ident",
  value: "auto",
};

/**
 * @param {AlignmentSide} side
 * @param {Token} token
 * @returns {ReturnedDeclaration}
 */
function createMarginCustomProperty(side, token) {
  return {
    property: "custom",
    value: {
      name: `--mu-margin-${side}`,
      value: [
        {
          type: "token",
          value: token,
        },
      ],
    },
  };
}

/**
 * @param {keyof typeof AlignmentCustomProperty} axis
 * @param {AlignmentSide} startSide
 * @param {AlignmentSide} endSide
 * @returns {Visitor<DefaultCustomAtRules>}
 */
function createAlignmentVisitor(axis, startSide, endSide) {
  return {
    Rule: {
      custom: {
        value(rule) {
          const preludeTokens = /** @type {Array<TokenOrValue>} */ (
            rule.prelude.value
          );

          /** @type {Array<ReturnedRule>} */
          const rules = [
            {
              type: "style",
              value: {
                loc: rule.loc,
                selectors: [[{ type: "nesting" }]],
                declarations: {
                  declarations: [
                    {
                      property: "custom",
                      value: {
                        name: AlignmentCustomProperty[axis],
                        value: preludeTokens.map(convertAlignmentTokenToFlex),
                      },
                    },
                    createMarginCustomProperty(
                      startSide,
                      hasRulePreludeValue(
                        rule.prelude,
                        StartAlignmentKeyword[axis],
                      )
                        ? ZERO_NUMBER_TOKEN
                        : AUTO_IDENT_TOKEN,
                    ),
                    createMarginCustomProperty(
                      endSide,
                      hasRulePreludeValue(
                        rule.prelude,
                        EndAlignmentKeyword[axis],
                      ) ||
                        hasRulePreludeValue(
                          rule.prelude,
                          StartAlignmentKeyword[axis],
                        )
                        ? ZERO_NUMBER_TOKEN
                        : AUTO_IDENT_TOKEN,
                    ),
                  ],
                },
              },
            },
          ];

          if (hasRulePreludeValue(rule.prelude, StartAlignmentKeyword[axis])) {
            rules.push({
              type: "style",
              value: {
                loc: rule.loc,
                selectors: [
                  [
                    { type: "class", name: Class.Element },
                    {
                      type: "pseudo-class",
                      kind: "has",
                      selectors: [
                        [
                          { type: "pseudo-class", kind: "scope" },
                          { type: "combinator", value: "later-sibling" },
                          { type: "nesting" },
                        ],
                      ],
                    },
                  ],
                ],
                declarations: {
                  declarations: [
                    createMarginCustomProperty(startSide, ZERO_NUMBER_TOKEN),
                    createMarginCustomProperty(endSide, ZERO_NUMBER_TOKEN),
                  ],
                },
              },
            });
          }

          if (
            hasRulePreludeValue(rule.prelude, "center") ||
            hasRulePreludeValue(rule.prelude, EndAlignmentKeyword[axis])
          ) {
            rules.push({
              type: "style",
              value: {
                loc: rule.loc,
                selectors: [
                  [
                    { type: "class", name: Class.Element },
                    {
                      type: "pseudo-class",
                      kind: "has",
                      selectors: [
                        [
                          { type: "pseudo-class", kind: "scope" },
                          { type: "combinator", value: "next-sibling" },
                          { type: "nesting" },
                        ],
                      ],
                    },
                  ],
                ],
                declarations: {
                  declarations: [
                    createMarginCustomProperty(endSide, ZERO_NUMBER_TOKEN),
                  ],
                },
              },
            });
          }

          if (hasRulePreludeValue(rule.prelude, EndAlignmentKeyword[axis])) {
            rules.push({
              type: "style",
              value: {
                loc: rule.loc,
                selectors: [
                  [
                    { type: "nesting" },
                    { type: "combinator", value: "later-sibling" },
                    { type: "class", name: Class.Element },
                  ],
                ],
                declarations: {
                  declarations: [
                    createMarginCustomProperty(startSide, ZERO_NUMBER_TOKEN),
                  ],
                },
              },
            });
          }

          return rules;
        },
      },
    },
  };
}

export const AlignmentXVisitor = createAlignmentVisitor("x", "left", "right");

export const AlignmentYVisitor = createAlignmentVisitor("y", "top", "bottom");

/**
 * @param {ParsedComponent} prelude
 * @param {Alignment} value
 * @returns {boolean}
 */
function hasRulePreludeValue(prelude, value) {
  return (
    prelude.type === "token-list" &&
    prelude.value[0].type === "token" &&
    prelude.value[0].value.type === "ident" &&
    prelude.value[0].value.value === value
  );
}

/**
 * @param {TokenOrValue} token
 * @returns {TokenOrValue}
 */
function convertAlignmentTokenToFlex(token) {
  if (token.type === "token" && token.value.type === "ident") {
    return {
      type: "token",
      value: {
        type: "ident",
        value: AlignmentToFlex[/** @type {Alignment} */ (token.value.value)],
      },
    };
  } else {
    return token;
  }
}
