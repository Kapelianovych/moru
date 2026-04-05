/**
 * @template Value
 * @callback Subscriber
 * @param {Value} value
 * @returns {void}
 */

/**
 * @template Value
 * @typedef {Object} Store
 * @property {function(): Value} get
 * @property {function(Value): void} set
 * @property {function(Subscriber<Value>): VoidFunction} subscribe
 * @property {function(VoidFunction): void} registerDispose
 */

/**
 * @template Value
 * @param {Value} initialValue
 * @returns {Store<Value>}
 */
export function store(initialValue) {
  let value = initialValue;

  /**
   * @type {Set<Subscriber<Value>>}
   */
  const subscribers = new Set();
  /**
   * @type {Set<VoidFunction>}
   */
  const disposes = new Set();

  return {
    get() {
      return value;
    },
    set(next) {
      value = next;
      subscribers.forEach((subscriber) => {
        subscriber(next);
      });
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);

      return () => {
        subscribers.delete(subscriber);

        if (!subscribers.size) {
          disposes.forEach((dispose) => {
            dispose();
          });
          disposes.clear();
          value = initialValue;
        }
      };
    },
    registerDispose(dispose) {
      disposes.add(dispose);
    },
  };
}

/**
 * @template Value
 * @template NextValue
 * @param {Store<Value>} target
 * @param {function(Value): NextValue} callback
 * @returns {Store<NextValue>}
 */
export function map(target, callback) {
  const nextStore = store(callback(target.get()));

  const stop = forEach(target, (value) => {
    nextStore.set(callback(value));
  });

  nextStore.registerDispose(stop);

  return nextStore;
}

/**
 * @template Value
 * @template NextValue
 * @param {Store<Value>} target
 * @param {function(Value): Store<NextValue>} callback
 * @returns {Store<NextValue>}
 */
export function flatMap(target, callback) {
  /**
   * @type {VoidFunction | undefined}
   */
  let dispose;
  const nextStore = callback(target.get());

  const stop = forEach(target, (value) => {
    dispose?.();
    dispose = forEach(callback(value), nextStore.set);
  });

  nextStore.registerDispose(() => {
    stop();
    dispose?.();
  });

  return nextStore;
}

/**
 * @template {Array<Store<any>>} Stores
 * @typedef {{
 *   [K in keyof Stores]: Stores[K] extends Store<infer V> ? V : never;
 * }} StoreValues
 */

/**
 * @template {Array<Store<any>>} const Stores
 * @param {Stores} stores
 * @returns {Store<StoreValues<Stores>>}
 */
export function combine(stores) {
  const nextStore = store(
    stores.map((store) => {
      return store.get();
    }),
  );

  const stops = stores.map((store) => {
    return forEach(store, () => {
      nextStore.set(
        stores.map((store) => {
          return store.get();
        }),
      );
    });
  });

  nextStore.registerDispose(() => {
    stops.forEach((stop) => {
      stop();
    });
  });

  // @ts-expect-error TS does not know type beforehand and complains about it
  return nextStore;
}

/**
 * @template Value
 * @overload
 * @param {Store<Value>} target
 * @param {function(Value): boolean} callback
 * @returns {Store<Value | undefined>}
 *
 * @overload
 * @param {Store<Value>} target
 * @param {function(Value): boolean} callback
 * @param {Value} initialValue
 * @returns {Store<Value>}
 *
 * @param {Store<Value>} target
 * @param {function(Value): boolean} callback
 * @param {Value} [initialValue]
 * @returns {Store<Value | undefined>}
 */
export function filter(target, callback, initialValue) {
  const nextStore = store(callback(target.get()) ? target.get() : initialValue);

  const stop = forEach(target, (value) => {
    if (callback(value)) {
      nextStore.set(value);
    }
  });

  nextStore.registerDispose(stop);

  return nextStore;
}

/**
 * @template Value
 * @param {Store<Value>} target
 * @returns {Store<Value>}
 */
export function distinct(target) {
  let previousValue = target.get();

  return filter(
    target,
    (value) => {
      const same = Object.is(value, previousValue);
      previousValue = value;
      return !same;
    },
    previousValue,
  );
}

/**
 * @template Value
 * @param {Store<Value>} store
 * @param {Subscriber<Value>} callback
 * @returns {VoidFunction}
 */
export function forEach(store, callback) {
  return store.subscribe(callback);
}
