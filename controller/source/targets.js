/**
 * @import { CustomElement } from "./controller.js";
 */

/**
 * @template {Element | undefined} E
 * @overload
 * @param {HTMLElement} controller
 * @param {string} name
 * @param {true} single
 * @returns {E}
 *
 * @template {Element} E
 * @overload
 * @param {HTMLElement} controller
 * @param {string} name
 * @param {false} single
 * @returns {Array<E>}
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
 * @template {Element | undefined} E
 * @param {ClassAccessorDecoratorTarget<CustomElement, E>} _
 * @param {ClassAccessorDecoratorContext<CustomElement, E>} context
 * @returns {ClassAccessorDecoratorResult<CustomElement, E>}
 */
export function target(_, context) {
  const stringifiedName = String(context.name);

  return {
    get() {
      return findTarget(this, stringifiedName, true);
    },
  };
}

/**
 * @template {Element} E
 * @param {ClassAccessorDecoratorTarget<CustomElement, Array<E>>} _
 * @param {ClassAccessorDecoratorContext<CustomElement, Array<E>>} context
 * @returns {ClassAccessorDecoratorResult<CustomElement, Array<E>>}
 */
export function targets(_, context) {
  const stringifiedName = String(context.name);

  return {
    get() {
      return findTarget(this, stringifiedName, false);
    },
  };
}
