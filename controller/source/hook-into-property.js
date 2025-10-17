/**
 * @template {Element} T
 * @template A
 * @param {T} target
 * @param {string | symbol} name
 * @param {function(this: T, A): A} get
 * @param {function(this: T, A, function(A): void, A): void} set
 */
export function hookIntoProperty(target, name, get, set) {
  const descriptor =
    /**
     * @type {TypedPropertyDescriptor<A>}
     */
    (Reflect.getOwnPropertyDescriptor(target, name));

  const getValueFromOriginalProperty =
    descriptor.get ??
    (() => {
      return (
        /**
         * @type {A}
         */
        (descriptor.value)
      );
    });
  const setValueToOriginalProperty =
    descriptor.set ??
    ((value) => {
      descriptor.value = value;
    });

  Reflect.defineProperty(target, name, {
    configurable: true,
    get() {
      return get.call(target, getValueFromOriginalProperty());
    },
    /**
     * @param {A} value
     */
    set(value) {
      set.call(
        target,
        value,
        setValueToOriginalProperty,
        get.call(target, getValueFromOriginalProperty()),
      );
    },
  });
}
