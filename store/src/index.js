/**
 * Compares two values and states whether they are equals.
 *
 * @template Value
 * @callback Comparator
 * @param {Value} previous
 * @param {Value} next
 * @returns {boolean}
 */

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
 * @property {function(Subscriber<Value>): void} unsubscribe
 * @property {function(): boolean} hasSubscribers
 */

/**
 * @template Value
 * @param {Value} value
 * @param {Comparator<Value>} equals
 * @returns {Store<Value>}
 */
export function store(value, equals = Object.is) {
  /** @type {Set<Subscriber<Value>>} */
  const subscribers = new Set();

  /** @type {Store<Value>['unsubscribe']} */
  const unsubscribe = (subscriber) => {
    subscribers.delete(subscriber);
  };

  return {
    get() {
      return value;
    },
    set(next) {
      if (!equals(value, next)) {
        value = next;
        subscribers.forEach((subscriber) => subscriber(value));
      }
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);

      return () => unsubscribe(subscriber);
    },
    unsubscribe,
    hasSubscribers() {
      return subscribers.size > 0;
    },
  };
}

/**
 * @template {Array<Store<unknown>>} Dependencies
 * @typedef {Dependencies extends []
 *   ? []
 *   : Dependencies extends [Store<infer A>, ...infer Rest extends Array<Store<unknown>>]
 *     ? [A, ...GetDependencyValueTypes<Rest>]
 *     : Dependencies extends Array<Store<infer B>>
 *       ? Array<B>
 *       : never
 * } GetDependencyValueTypes
 */

/**
 * @template {Array<Store<unknown>>} Dependencies
 * @template Value
 * @typedef {(currentValue: Value | undefined, ...args: GetDependencyValueTypes<Dependencies>) => Value} Computation
 */

/**
 * @template Value
 * @template {Array<Store<any>>} const Dependencies
 * @param {Dependencies} dependencies
 * @param {Computation<Dependencies, Value>} computation
 * @param {Comparator<Value>} [equals]
 * @returns {Store<Value>}
 */
export function computed(dependencies, computation, equals) {
  /** @type {Subscriber<void>} */
  const computedSubscriber = () => {
    const computedValue = computation(
      result.get(),
      .../** @type {GetDependencyValueTypes<Dependencies>} */ (
        dependencies.map((store) => store.get())
      ),
    );
    result.set(computedValue);
  };
  const subscribeToDependencies = () =>
    dependencies.map((store) => store.subscribe(computedSubscriber));

  const result = store(/** @type {Value} */ (undefined), equals);

  /** @type {Array<VoidFunction> | undefined | null} */
  let subscriptions;

  const originalSubscribe = result.subscribe;
  const originalUnsubscribe = result.unsubscribe;

  const unsubscribeOnLastSubscriberRemoval = () => {
    if (!result.hasSubscribers()) {
      subscriptions?.forEach((unsubscribe) => unsubscribe());
      subscriptions = null;
    }
  };

  result.subscribe = (subscriber) => {
    if (!result.hasSubscribers()) {
      computedSubscriber();
      subscriptions = subscribeToDependencies();
    }

    const unsubscribe = originalSubscribe(subscriber);

    return () => {
      unsubscribe();
      unsubscribeOnLastSubscriberRemoval();
    };
  };
  result.unsubscribe = (subscriber) => {
    originalUnsubscribe(subscriber);
    unsubscribeOnLastSubscriberRemoval();
  };

  return result;
}

/**
 * @callback Scheduler
 * @param {VoidFunction} callback
 * @returns {void}
 */

/**
 * Immediately calls the provided {@link callback}.
 *
 * @type {Scheduler}
 */
export const immediately = (callback) => callback();

/**
 * @template {Array<Store<any>>} Dependencies
 * @typedef {(
 *    ...args: GetDependencyValueTypes<Dependencies>
 *  ) => VoidFunction | null | void} Effect
 */

/**
 * @template {Array<Store<any>>} const Dependencies
 * @param {Dependencies} dependencies
 * @param {Effect<Dependencies>} effect
 * @param {Scheduler} schedule
 * @returns {VoidFunction}
 */
export function subscribe(dependencies, effect, schedule = immediately) {
  let idle = true;
  /** @type {VoidFunction | void | null} */
  let cleanup;

  const wrappedEffect = () => {
    // In case, subscriptions were cancelled but a next tick was scheduled
    // and not yet executed.
    if (idle) return;

    cleanup?.();
    cleanup = effect.apply(
      null,
      /** @type {GetDependencyValueTypes<Dependencies>} */ (
        dependencies.map((store) => store.get())
      ),
    );

    idle = true;
  };
  /** @type {Subscriber<void>} */
  const subscriber = () => {
    if (idle) {
      idle = false;

      schedule(wrappedEffect);
    }
  };

  const subscriptions = dependencies.map((store) =>
    store.subscribe(subscriber),
  );

  // Call subscriber on creation.
  subscriber();

  return () => {
    idle = true;
    cleanup?.();
    subscriptions.forEach(immediately);
  };
}
