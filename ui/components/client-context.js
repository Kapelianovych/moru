/**
 * @import { Ref } from "./ref.js";
 */

import { isRef } from "./ref.js";
import { createId } from "./lib/id.js";

const CONTEXTS = Symbol("@moru/ui/contexts");

/**
 * @private
 * @typedef {Element & { [CONTEXTS]: Record<string, unknown> }} ElementWithContexts
 */

/**
 * @template A
 * @typedef {Object} Context
 * @property {string} id
 * @property {A} defaultValue
 * @property {function(Element, A): void} assignTo
 */

/**
 * @template A
 * @param {A} defaultValue
 * @returns {Context<A>}
 */
export function createContext(defaultValue) {
  const contextId = createId();

  return {
    id: contextId,
    defaultValue,

    assignTo(element, value) {
      /**
       * @type {ElementWithContexts}
       */
      (element)[CONTEXTS] ??= {};
      /**
       * @type {ElementWithContexts}
       */
      (element)[CONTEXTS][contextId] = value;
    },
  };
}

/**
 * @template A
 * @param {Ref | Element} elementOrRef
 * @param {Context<A>} context
 * @returns {A}
 */
export function useContext(elementOrRef, context) {
  /**
   * @type {Element | null}
   */
  let element = isRef(elementOrRef)
    ? document.querySelector(elementOrRef.selector)
    : elementOrRef;

  while (true) {
    if (!element) {
      return context.defaultValue;
    }

    const contexts = /** @type {ElementWithContexts} */ (element)[CONTEXTS];

    if (!contexts) {
      element = element.parentElement;
      continue;
    }

    if (context.id in contexts) {
      return /** @type {A} */ (contexts[context.id]);
    }

    element = element.parentElement;
  }
}
