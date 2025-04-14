/**
 * @import { LengthUnit } from "lightningcss";
 *
 * @import { Ref } from "./ref.js";
 */

import { isRef } from "./ref.js";
import { Class, PrivateProperties } from "./lib/names.js";

/**
 * @typedef {|
 *  HTMLElement &
 *    {
 *      [PrivateProperties.ClientRootContext]: ClientRootContext
 *    }
 * } RootHTMLElement
 */

/**
 * @typedef {Object} ClientRootContext
 * @property {LengthUnit} defaultCSSUnit
 */

/**
 * @param {Ref | Element} elementOrRef
 * @returns {ClientRootContext}
 */
export function useClientRootContext(elementOrRef) {
  const element = isRef(elementOrRef)
    ? document.querySelector(elementOrRef.selector)
    : elementOrRef;

  const root = element?.closest(`.${Class.Root}`);

  return /** @type {RootHTMLElement} */ (root)[
    PrivateProperties.ClientRootContext
  ];
}
