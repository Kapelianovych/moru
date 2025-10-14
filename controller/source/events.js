/**
 * @import { CustomElement } from "./controller.js";
 */

/**
 * @template A
 * @typedef {Object} EventEmitter
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
   * @returns {EventEmitter<A>}
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
 * @template {Event} E
 * @callback EventListenerFunction
 * @param {E} event
 * @returns {void}
 */

/**
 * @template {Event} E
 * @typedef {Object} EventListenerObject
 * @property {EventListenerFunction<E>} handleEvent
 */

/**
 * @template {Event} E
 * @typedef {EventListenerFunction<E> | EventListenerObject<E>} EventListener
 */

/**
 * @template {Event} E
 * @param {unknown} _
 * @param {|
 *   ClassMethodDecoratorContext<CustomElement, EventListenerFunction<E>>
 *   | ClassFieldDecoratorContext<CustomElement, EventListener<E>>
 * } context
 */
export function listen(_, context) {
  context.addInitializer(function () {
    let listener = context.access.get(this);

    if (typeof listener === "function") {
      listener = listener.bind(this);
    }

    this.addEventListener(
      String(context.name),
      /**
       * @type {EventListenerOrEventListenerObject}
       */
      (listener),
    );
  });
}
