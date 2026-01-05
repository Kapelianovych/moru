/**
 * @import { CustomElement } from "./controller.js";
 */

import { toKebabCase } from "./to-kebab-case.js";

/**
 * @param {string | symbol} field
 */
export function watch(field) {
  const attributeName = toKebabCase(String(field));

  /**
   * @param {unknown} _
   * @param {ClassMethodDecoratorContext<CustomElement>} context
   */
  return (_, context) => {
    context.addInitializer(function () {
      const attributes =
        /**
         * @type {Map<string, Set<ClassMethodDecoratorContext['access']['get']>> | undefined}
         */
        (context.metadata.attributes);
      const properties =
        /**
         * @type {Map<string | symbol, Set<ClassMethodDecoratorContext['access']['get']>> | undefined}
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
 * @param {Map<string | symbol, Set<ClassMethodDecoratorContext['access']['get']>> | undefined} watchers
 */
export function callWatchers(classInstance, dependency, watchers) {
  watchers?.get(dependency)?.forEach((getWatcher) => {
    getWatcher(classInstance).call(classInstance);
  });
}
