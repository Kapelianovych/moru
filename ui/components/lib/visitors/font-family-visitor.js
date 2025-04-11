/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
export const FontFamilyVisitor = {
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
                    name: CustomProperty.FontFamily,
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
