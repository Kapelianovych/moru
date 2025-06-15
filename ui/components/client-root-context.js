/**
 * @import { LengthUnit } from "lightningcss";
 *
 * @import { Context } from "./client-context.js";
 */

import { createContext } from "./client-context.js";

/**
 * @typedef {Object} ClientRootContext
 * @property {LengthUnit} defaultCSSUnit
 */

/**
 * @type {Context<ClientRootContext>}
 */
export const ClientRootContext = createContext(
  /** @type {ClientRootContext} */ (/** @type {unknown} */ (null)),
);
