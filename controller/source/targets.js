/**
 * @import { CustomElement } from "./controller.js";
 */

import { hookIntoProperty } from "./hook-into-property.js";

/**
 * @overload
 * @param {HTMLElement} controller
 * @param {string} name
 * @param {true} single
 * @returns {Element | undefined}
 *
 * @overload
 * @param {HTMLElement} controller
 * @param {string} name
 * @param {false} single
 * @returns {Array<Element>}
 *
 * @param {HTMLElement} controller
 * @param {string} name
 * @param {boolean} single
 * @returns {Array<Element> | Element | undefined}
 */
function findTarget(controller, name, single) {
  const tag = controller.tagName.toLowerCase();
  const selector = `[data-target~="${tag}.${name}"]`;
  /**
   * @type {Array<Element>}
   */
  const targets = [];

  if (controller.shadowRoot) {
    for (const element of controller.shadowRoot.querySelectorAll(selector)) {
      // Element is child of the current shadow root and not any nested controller.
      if (!element.closest(tag)) {
        if (single) {
          return element;
        } else {
          targets.push(element);
        }
      }
    }
  }

  for (const element of controller.querySelectorAll(selector)) {
    if (element.closest(tag) === controller) {
      if (single) {
        return element;
      } else {
        targets.push(element);
      }
    }
  }

  if (!single) {
    return targets;
  }
}

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement>} context
 */
export function target(_, context) {
  const stringifiedName = String(context.name);

  context.addInitializer(function () {
    hookIntoProperty(
      this,
      context.name,
      () => {
        return findTarget(this, stringifiedName, true);
      },
      () => {},
    );
  });
}

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement>} context
 */
export function targets(_, context) {
  const stringifiedName = String(context.name);

  context.addInitializer(function () {
    hookIntoProperty(
      this,
      context.name,
      () => {
        return findTarget(this, stringifiedName, false);
      },
      () => {},
    );
  });
}
