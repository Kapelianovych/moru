/**
 * @import { CustomElement } from "./controller.js";
 */

/**
 * @template A
 * @callback ObserverSubscriber
 * @param {function(A): void} consume
 * @returns {VoidFunction}
 */

/**
 * @template A
 * @typedef {Object} Observer
 * @property {ObserverSubscriber<A>} subscribe
 */

/**
 * @typedef {Object} ObserverRecord
 * @property {function(unknown): void} consume
 * @property {ObserverSubscriber<unknown>} subscribe
 */

/**
 * @template A
 * @param {Observer<A> | ObserverSubscriber<A>} observer
 */
export function observe(observer) {
  const subscribe =
    typeof observer === "function"
      ? observer
      : observer.subscribe.bind(observer);

  /**
   * @param {ObserverRecord['consume']} consume
   * @param {ClassMethodDecoratorContext<CustomElement, ObserverRecord['consume']>} context
   */
  return (consume, context) => {
    const observers =
      /**
       * @type {Array<ObserverRecord>}
       */
      (context.metadata.observers ??= []);

    observers.push({
      consume,
      subscribe,
    });
  };
}

/**
 * @param {CustomElement} classInstance
 * @param {DecoratorMetadataObject} metadata
 */
export function startObservers(classInstance, metadata) {
  const observers =
    /**
     * @type {Array<ObserverRecord>}
     */
    (metadata.observers ??= []);

  const disposals = (classInstance.$disposals ??= new Set());

  observers.forEach(({ subscribe, consume }) => {
    const unsubscribe = subscribe(consume);

    disposals.add(unsubscribe);
  });
}
