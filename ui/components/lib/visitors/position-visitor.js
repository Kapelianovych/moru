/**
 * @import { Visitor, TokenOrValue, ReturnedDeclaration } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/**
 * @typedef {'initial' | 'in-front' | 'behind-content' | 'above' | 'below' | 'on-left' | 'on-right'} Position
 */

/** @type {Readonly<Record<Position, string>>} */
const PositionToCSS = Object.freeze({
  initial: "relative",
  "in-front": "absolute",
  "behind-content": "absolute",
  above: "absolute",
  below: "absolute",
  "on-left": "absolute",
  "on-right": "absolute",
});

/** @type {Visitor<DefaultCustomAtRules>} */
export const PositionVisitor = {
  Rule: {
    custom: {
      value(rule) {
        const preludeRules = /** @type {Array<TokenOrValue>} */ (
          rule.prelude.value
        );

        const specifiedPosition = getPositionValue(preludeRules[0]);

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
                    name: CustomProperty.Position,
                    value: [
                      {
                        type: "token",
                        value: {
                          type: "ident",
                          value: PositionToCSS[specifiedPosition],
                        },
                      },
                    ],
                  },
                },
                ...calculatePositionedAreaFor(specifiedPosition),
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
 * @returns {Position}
 */
function getPositionValue(token) {
  if (token.type === "token" && token.value.type === "ident") {
    return /** @type {Position} */ (token.value.value);
  }

  return "initial";
}

/**
 * @param {Position} position
 * @returns {Array<ReturnedDeclaration>}
 */
function calculatePositionedAreaFor(position) {
  return [
    {
      property: "custom",
      value: {
        name: CustomProperty.PositionTopOffset,
        value: [
          {
            type: "token",
            value:
              position === "above"
                ? {
                    type: "ident",
                    value: "initial",
                  }
                : {
                    type: "percentage",
                    value: position === "below" ? 1 : 0,
                  },
          },
        ],
      },
    },
    {
      property: "custom",
      value: {
        name: CustomProperty.PositionBottomOffset,
        value: [
          {
            type: "token",
            value:
              position === "above"
                ? {
                    type: "percentage",
                    value: 1,
                  }
                : {
                    type: "ident",
                    value: "initial",
                  },
          },
        ],
      },
    },
    {
      property: "custom",
      value: {
        name: CustomProperty.PositionLeftOffset,
        value: [
          {
            type: "token",
            value:
              position === "on-left"
                ? {
                    type: "ident",
                    value: "initial",
                  }
                : {
                    type: "percentage",
                    value: position === "on-right" ? 1 : 0,
                  },
          },
        ],
      },
    },
    {
      property: "custom",
      value: {
        name: CustomProperty.PositionRightOffset,
        value: [
          {
            type: "token",
            value:
              position === "on-left"
                ? {
                    type: "percentage",
                    value: 1,
                  }
                : {
                    type: "ident",
                    value: "initial",
                  },
          },
        ],
      },
    },
    {
      property: "custom",
      value: {
        name: CustomProperty.PositionAxisOffset,
        value: [
          {
            type: "token",
            value: {
              type: "number",
              value:
                position === "behind-content"
                  ? 0
                  : position === "in-front"
                    ? 2
                    : 1,
            },
          },
        ],
      },
    },
    {
      property: "custom",
      value: {
        name: CustomProperty.PositionedHeight,
        value: [
          {
            type: "token",
            value:
              position === "behind-content" ||
              position === "on-left" ||
              position === "on-right" ||
              position === "in-front"
                ? {
                    type: "percentage",
                    value: 1,
                  }
                : { type: "ident", value: "auto" },
          },
        ],
      },
    },
    {
      property: "custom",
      value: {
        name: CustomProperty.PositionedWidth,
        value: [
          {
            type: "token",
            value:
              position === "behind-content" ||
              position === "above" ||
              position === "below" ||
              position === "in-front"
                ? {
                    type: "percentage",
                    value: 1,
                  }
                : { type: "ident", value: "auto" },
          },
        ],
      },
    },
  ];
}
