/**
 * @typedef {Record<string, unknown>} LocalThis
 */

/**
 * @returns {LocalThis}
 */
export function createLocalThis() {
  return {};
}

/**
 * @param {LocalThis} localThis
 * @param {string} key
 * @param {unknown} value
 * @returns {VoidFunction}
 */
export function augmentLocalThis(localThis, key, value) {
  /** @type {VoidFunction} */
  let rollback;

  if (key in localThis) {
    const currentValueDescriptor =
      /** @type {TypedPropertyDescriptor<unknown>} */
      (Reflect.getOwnPropertyDescriptor(localThis, key));

    rollback = () => {
      Reflect.defineProperty(localThis, key, currentValueDescriptor);
    };
  } else {
    rollback = () => {
      delete localThis[key];
    };
  }

  Reflect.defineProperty(localThis, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  return rollback;
}
