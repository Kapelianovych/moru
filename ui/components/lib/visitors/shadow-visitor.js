/**
 * @import { Visitor, TokenOrValue } from "lightningcss";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { CustomProperty } from "../names.js";

/** @type {Visitor<DefaultCustomAtRules>} */
export const ShadowVisitor = {
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
                    name: CustomProperty.Shadow,
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
