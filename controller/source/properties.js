/**
 * @import { CustomElement } from "./controller.js";
 */

import { hookIntoProperty } from "./hook-into-property.js";

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement>} context
 */
export function property(_, context) {
  const properties =
    /**
     * @type {Map<string | symbol, Set<string | symbol>>}
     */
    (context.metadata.properties ??= new Map());

  properties.set(context.name, new Set());

  context.addInitializer(function () {
    hookIntoProperty(
      this,
      context.name,
      (value) => value,
      (value, set, currentValue) => {
        if (!Object.is(value, currentValue)) {
          set(value);
          properties.get(context.name)?.forEach((watcher) => {
            // @ts-expect-error method signature does not exist yet
            this[watcher]();
          });
        }
      },
    );
  });
}
