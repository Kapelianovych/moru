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
 * @template A
 * @typedef {Object} ObserverRecord
 * @property {Parameters<ObserverSubscriber<A>>[0]} consume
 * @property {ObserverSubscriber<A>} subscribe
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
   * @param {ObserverRecord<A>['consume']} consume
   * @param {ClassMethodDecoratorContext<CustomElement, ObserverRecord<A>['consume']>} context
   */
  return (consume, context) => {
    const observers =
      /**
       * @type {Array<ObserverRecord<any>>}
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
     * @type {Array<ObserverRecord<unknown>>}
     */
    (metadata.observers ??= []);

  const disposals = (classInstance.$disposals ??= new Set());

  observers.forEach(({ subscribe, consume }) => {
    const unsubscribe = subscribe(consume.bind(classInstance));

    disposals.add(unsubscribe);
  });
}
