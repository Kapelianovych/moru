/**
 * @import { CustomElement } from "./controller.js";
 */

/**
 * @template A
 * @typedef {Object} Emitter
 * @property {function(A): void} emit
 */

/**
 * @template A
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement>} context
 */
export function event(_, context) {
  /**
   * @this {CustomElement}
   * @returns {Emitter<A>}
   */
  return function () {
    const self = this;

    return {
      /**
       * @param {A} detail
       */
      emit(detail) {
        self.dispatchEvent(
          new CustomEvent(String(context.name), {
            bubbles: true,
            composed: true,
            detail,
          }),
        );
      },
    };
  };
}

/**
 * @param {function(Event): void} method
 * @param {ClassMethodDecoratorContext<CustomElement>} context
 */
export function listen(method, context) {
  context.addInitializer(function () {
    this.addEventListener(String(context.name), (event) => {
      method.call(this, event);
    });
  });
}
