/**
 * @import { CustomElement } from "./controller.js";
 */

import { createName } from "./create-name.js";

/**
 * @template A
 * @typedef {Object} EventEmitter
 * @property {function(A): void} emit
 */

/**
 * @template A
 * @param {string} [name]
 */
export function Event(name) {
  /**
   * @param {unknown} _
   * @param {ClassFieldDecoratorContext<CustomElement>} context
   */
  return (_, context) => {
    const eventName = name ?? createName(context.name);
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
            new CustomEvent(eventName, {
              bubbles: true,
              composed: true,
              detail,
            }),
          );
        },
      };
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
 * @param {string} [name]
 */
export function Listen(name) {
  /**
   * @param {unknown} _
   * @param {|
   *   ClassMethodDecoratorContext<CustomElement, EventListenerFunction<E>>
   *   | ClassFieldDecoratorContext<CustomElement, EventListener<E>>
   * } context
   */
  return (_, context) => {
    const eventName = name ?? createName(context.name);
    context.addInitializer(function () {
      let listener = context.access.get(this);

      if (typeof listener === "function") {
        listener = listener.bind(this);
      }

      this.addEventListener(
        eventName,
        /**
         * @type {EventListenerOrEventListenerObject}
         */
        (listener),
      );
    });
  };
}
