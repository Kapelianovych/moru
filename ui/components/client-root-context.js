/**
 * @import { LengthUnit } from "lightningcss";
 *
 * @import { Ref } from "./ref.js";
 * @import { Context } from "./client-context.js";
 */

import { createContext, useContext } from "./client-context.js";

/**
 * @typedef {Object} ClientRootContext
 * @property {LengthUnit} defaultCSSUnit
 */

/**
 * @type {Context<ClientRootContext | null>}
 */
export const ClientRootContext = createContext(
  /** @type {ClientRootContext | null} */ (null),
);

/**
 * @param {Ref | Element} elementOrRef
 * @returns {ClientRootContext | null}
 */
export function useClientRootContext(elementOrRef) {
  return useContext(elementOrRef, ClientRootContext);
}
