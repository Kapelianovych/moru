/**
 * @typedef {Object} Ref
 * @property {string} $$typeof
 * @property {string} id
 * @property {string} selector
 */

const REF = "__@moru/ui/ref_kfj837dj";

/**
 * @returns {Ref}
 */
export function createRef() {
  return /** @type {Ref} */ ({ $$typeof: REF });
}

/**
 * @param {unknown} value
 * @returns {value is Ref}
 */
export function isRef(value) {
  return /** @type {Ref | undefined} */ (value)?.$$typeof === REF;
}
