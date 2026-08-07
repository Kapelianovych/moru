import { bindActions } from "./actions.js";
import { toKebabCase } from "./to-kebab-case.js";
import { callWatchers } from "./watch.js";
import { initialiseObservedAttributes } from "./attributes.js";

/**
 * @typedef {Object} ElementLifecycleCallbacks
 * @property {function(): void} [connectedCallback]
 * @property {function(string, string | null, string | null): void} [attributeChangedCallback]
 * @property {function(): void} [disconnectedCallback]
 * @property {function(): void} [adoptedCallback]
 * @property {function(HTMLFormElement): void} [formAssociatedCallback]
 * @property {function(): void} [formResetCallback]
 * @property {function(boolean): void} [formDisabledCallback]
 * @property {function(string | File | FormData, 'restore' | 'autocomplete'): void} [formStateRestoreCallback]
 */

/**
 * @typedef {HTMLElement & ElementLifecycleCallbacks} CustomElement
 */

/**
 * @typedef {{
 *   new (): CustomElement;
 *   prototype: CustomElement;
 *   formAssociated?: boolean;
 *   observedAttributes?: Array<string>;
 * }} CustomElementClass
 */

/**
 * @param {CustomElementClass} classConstructor
 * @param {ClassDecoratorContext<CustomElementClass>} context
 */
export function controller(classConstructor, context) {
  context.addInitializer(function () {
    initialiseObservedAttributes(classConstructor, context.metadata);
    initialiseConnectedCallback(classConstructor, context.metadata);
    initialiseAttributeChangedCallback(classConstructor, context.metadata);
    initialiseDisconnectedCallback(classConstructor, context.metadata);

    register(classConstructor);
  });
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 */
function initialiseConnectedCallback(classConstructor, metadata) {
  const connectedCallback = classConstructor.prototype.connectedCallback;
  classConstructor.prototype.connectedCallback = function () {
    const internalController = InternalController.resolve(this);
    bindActions(this);
    internalController.initialisers.forEach((initialise) => {
      initialise(this, metadata);
    });
    internalController.initialisers.clear();
    connectedCallback?.call(this);
    internalController.connectedCallbackCalled = true;
  };
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 */
function initialiseAttributeChangedCallback(classConstructor, metadata) {
  const attributeChangedCallback =
    classConstructor.prototype.attributeChangedCallback;
  classConstructor.prototype.attributeChangedCallback =
    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    function (name, oldValue, newValue) {
      const internalController = InternalController.resolve(this);
      // If Element has attributes in HTML, then for each of them attributeChangedCallback method
      // will be called during parsing phase (before connectedCallback method). At this time
      // children and the rest of the document after this element are not yet initialised,
      // so we usually want to skip those calls.
      if (internalController.connectedCallbackCalled) {
        if (!Object.is(oldValue, newValue)) {
          callWatchers(
            this,
            name,
            /**
             * @type {Map<string, Set<ClassMethodDecoratorContext['access']['get']>> | undefined}
             */
            (metadata.attributes),
          );
          attributeChangedCallback?.call(this, name, oldValue, newValue);
        }
      }
    };
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 */
function initialiseDisconnectedCallback(classConstructor, metadata) {
  const disconnectedCallback = classConstructor.prototype.disconnectedCallback;
  classConstructor.prototype.disconnectedCallback = function () {
    disconnectedCallback?.call(this);
    const internalController = InternalController.resolve(this);
    internalController.disposals.forEach((dispose) => {
      dispose(this, metadata);
    });
    internalController.disposals.clear();
    internalController.connectedCallbackCalled = false;
  };
}

/**
 * @param {CustomElementClass} classConstructor
 */
function register(classConstructor) {
  const name = toKebabCase(classConstructor.name).replace(/-element$/, "");

  if (!window.customElements.get(name)) {
    window.customElements.define(name, classConstructor);
    // @ts-expect-error
    window[classConstructor.name] = window.customElements.get(name);
  }
}

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
}
