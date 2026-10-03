/**
 * @import { CustomElement } from "./controller.js";
 */

import { createName } from "./create-name.js";

/**
 * @template {boolean} A
 * @typedef {Object} TargetOptions
 * @property {string} [name]
 * @property {A} [all]
 */

/**
 * @template E
 * @callback TargetDecorator
 * @param {ClassAccessorDecoratorTarget<CustomElement, E>} _
 * @param {ClassAccessorDecoratorContext<CustomElement, E>} context
 * @returns {ClassAccessorDecoratorResult<CustomElement, E>}
 */

/**
 * @template {Element} E
 * @overload
 * @param {Required<Omit<TargetOptions<true>, 'name'>> & Pick<TargetOptions<true>, 'name'>} options
 * @returns {TargetDecorator<Array<E>>}
 */
/**
 * @template {Element} E
 * @overload
 * @param {TargetOptions<false>} [options]
 * @returns {TargetDecorator<E | undefined>}
 */
/**
 * @template {Element} E
 * @param {TargetOptions<boolean>} [options]
 * @returns {TargetDecorator<Array<E> | E | undefined>}
 */
export function Target(options) {
  return (_, context) => {
    const name = options?.name ?? createName(context.name);
    return {
      get() {
        const tag = this.tagName.toLowerCase();
        const single =
          options == null || options.all == null ? true : !options.all;
        const selector = `[data-target~="${tag}.${name}"]`;
        /**
         * @type {Array<E>}
         */
        const targets = [];

        if (this.shadowRoot != null) {
          for (const element of this.shadowRoot.querySelectorAll(selector)) {
            // Element is child of the current shadow root and not any nested controller.
            if (!element.closest(tag)) {
              if (single) {
                return (
                  /**
                   * @type {E}
                   */
                  (element)
                );
              } else {
                targets.push(
                  /**
                   * @type {E}
                   */
                  (element),
                );
              }
            }
          }
        }

        for (const element of this.querySelectorAll(selector)) {
          if (element.closest(tag) === this) {
            if (single) {
              return (
                /**
                 * @type {E}
                 */
                (element)
              );
            } else {
              targets.push(
                /**
                 * @type {E}
                 */
                (element),
              );
            }
          }
        }

        if (!single) {
          return targets;
        }
      },
    };
  };
}
