/**
 * @import { CustomElement } from "./controller.js";
 */

import { createName } from "./create-name.js";

/**
 * @callback GetAccessor
 * @param {CustomElement} object
 * @returns {VoidFunction}
 */

/**
 * @param {string | symbol} field
 */
export function Watch(field) {
  const attributeName = createName(field);
  /**
   * @param {unknown} _
   * @param {|
   *   ClassMethodDecoratorContext<CustomElement, VoidFunction>
   *   | ClassFieldDecoratorContext<CustomElement, VoidFunction>
   * } context
   */
  return (_, context) => {
    context.addInitializer(function () {
      const attributes =
        /**
         * @type {Map<string, Set<GetAccessor>> | undefined}
         */
        (context.metadata.attributes);
      const properties =
        /**
         * @type {Map<string | symbol, Set<GetAccessor>> | undefined}
         */
        (context.metadata.properties);

      attributes?.get(attributeName)?.add(context.access.get);
      properties?.get(field)?.add(context.access.get);
    });
  };
}

/**
 * @param {CustomElement} classInstance
 * @param {string | symbol} dependency
 * @param {Map<string | symbol, Set<GetAccessor>> | undefined} watchers
 */
export function callWatchers(classInstance, dependency, watchers) {
  watchers?.get(dependency)?.forEach((getWatcher) => {
    getWatcher(classInstance).call(classInstance);
  });
}
