import { PrivateProperties } from "./lib/names.js";

/**
 * @typedef {Object} Ref
 * @property {string} id
 * @property {string} selector
 */

const REF = "__@moru/ui/ref_kfj837dj";

/**
 * @returns {Ref}
 */
export function createRef() {
  return /** @type {any} */ ({ [PrivateProperties.TypeOf]: REF });
}

/**
 * @param {unknown} value
 * @returns {value is Ref}
 */
export function isRef(value) {
  return /** @type {any} */ (value)?.[PrivateProperties.TypeOf] === REF;
}
