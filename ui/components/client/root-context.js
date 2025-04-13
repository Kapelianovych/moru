/**
 * @import { Ref } from "../ref.js";
 * @import { RootContext } from "../lib/root-context.js";
 */

import { isRef } from "../ref.js";
import { Class } from "../lib/names.js";

/**
 * @param {Ref} rootRef
 * @param {RootContext} rootContext
 * @returns {void}
 */
export function defineRootContext(rootRef, rootContext) {
  const element = document.querySelector(rootRef.selector);

  /**
   * @type {HTMLElement & { $$rootContext?: RootContext }}
   */ (element).$$rootContext = rootContext;
}

/**
 * @param {Ref | Element} elementOrRef
 * @returns {RootContext}
 */
export function useRootContext(elementOrRef) {
  const element = isRef(elementOrRef)
    ? document.querySelector(elementOrRef.selector)
    : elementOrRef;

  const root = element?.closest(`.${Class.Root}`);

  return /** @type {HTMLElement & { $$rootContext: RootContext }} */ (root)
    .$$rootContext;
}
