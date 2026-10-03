/**
 * @import { Container } from "./container.js";
 * @import { CustomElement } from "./controller.js";
 */

/**
 * Encapsulates custom properties and logic of every controller.
 */
export class InternalController {
  /**
   * Key for instance of internal controller on `Element` instance.
   * @readonly
   */
  static key = Symbol.for("moru-internal-controller");
  /**
   * Resolves (and assigns if absent) an instance of {@link InternalController} to {@link CustomElement}.
   * @param {CustomElement} on
   * @returns {InternalController}
   */
  static resolve(on) {
    /**
     * @type {any}
     */
    const instance = on;
    return (instance[this.key] ??= new this());
  }
  connectedCallbackCalled = false;
  /**
   * @type {Set<function(CustomElement, DecoratorMetadataObject): void>}
   */
  initialisers = new Set();
  /**
   * @type {Set<function(CustomElement, DecoratorMetadataObject): void>}
   */
  disposals = new Set();
  /**
   * @type {Map<string | symbol, Set<function(unknown): void>> | undefined}
   */
  registeredConsumersPerContext;
  /**
   * @type {Container | null}
   */
  container = null;
}
