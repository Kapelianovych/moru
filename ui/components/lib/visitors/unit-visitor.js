/**
 * @import { Visitor } from "lightningcss";
 * @import { BuildStore } from "@moru/core";
 *
 * @import { DefaultCustomAtRules } from "../property.js";
 */

import { useRootContext } from "../root-context.js";

/**
 * @param {BuildStore} buildStore
 * @returns {Visitor<DefaultCustomAtRules>}
 */
export function createUnitVisitor(buildStore) {
  const rootContext = useRootContext(buildStore);

  return {
    Token: {
      dimension(token) {
        switch (token.unit) {
          case "un":
            return {
              type: "length",
              value: {
                unit: rootContext.defaultCSSUnit,
                value: token.value,
              },
            };
        }
      },
    },
  };
}
