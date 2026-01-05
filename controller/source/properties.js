/**
 * @import { CustomElement } from "./controller.js";
 */

import { callWatchers } from "./watch.js";

/**
 * @template A
 * @param {ClassAccessorDecoratorTarget<CustomElement, A>} target
 * @param {ClassAccessorDecoratorContext<CustomElement, A>} context
 * @returns {ClassAccessorDecoratorResult<CustomElement, A>}
 */
export function property(target, context) {
  const properties =
    /**
     * @type {Map<string | symbol, Set<ClassMethodDecoratorContext['access']['get']>>}
     */
    (context.metadata.properties ??= new Map());

  properties.set(context.name, new Set());

  return {
    set(value) {
      const currentValue = target.get.call(this);

      if (!Object.is(value, currentValue)) {
        target.set.call(this, value);
        callWatchers(this, context.name, properties);
      }
    },
  };
}
