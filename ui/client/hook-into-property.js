/**
 * @template {Element} T
 * @param {T} target
 * @param {string | symbol} name
 * @param {function(this: T, unknown): unknown} get
 * @param {function(this: T, unknown, function(unknown): void): void} set
 */
export function hookIntoProperty(target, name, get, set) {
  const descriptor =
    /**
     * @type {TypedPropertyDescriptor<unknown>}
     */
    (Reflect.getOwnPropertyDescriptor(target, name));

  const getValueFromOriginalProperty =
    descriptor.get ??
    (() => {
      return descriptor.value;
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
    set(value) {
      set.call(target, value, setValueToOriginalProperty);
    },
  });
}
