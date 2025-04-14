/**
 * @import { Ref } from "./ref.js";
 */

import { useClientRootContext } from "./client-root-context.js";

/**
 * @param {Ref | Element} elementOrRef
 * @returns {function(number | `${number}un`): string}
 */
export function useUnitConverter(elementOrRef) {
  const clientRootContext = useClientRootContext(elementOrRef);

  return (value) => {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    return `${numericValue}${clientRootContext.defaultCSSUnit}`;
  };
}
