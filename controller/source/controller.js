import { bindActions } from "./actions.js";
import { toKebabCase } from "./to-kebab-case.js";
import {
  callAttributeWatchers,
  initialiseObservedAttributes,
} from "./attributes.js";

/**
 * These properties are deliberately marked as optional to not enforce them onto
 * user's controllers even though they are always initialised.
 *
 * @package
 * @typedef {Object} InternalElementProperties
 * @property {function(): boolean} [$connectedCallbackCalled]
 * @property {function(boolean): void} [$setConnectedCallbackCalled]
 * @property {function(): Set<function(CustomElement, DecoratorMetadataObject): void>} [$initialisers]
 * @property {function(): Set<function(CustomElement, DecoratorMetadataObject): void>} [$disposals]
 */

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
 * @typedef {HTMLElement & InternalElementProperties & ElementLifecycleCallbacks} CustomElement
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
    initialiseProperties(classConstructor);
    initialiseObservedAttributes(classConstructor, context.metadata);
    initialiseConnectedCallback(classConstructor, context.metadata);
    initialiseAttributeChangedCallback(classConstructor, context.metadata);
    initialiseDisconnectedCallback(classConstructor, context.metadata);

    register(classConstructor);
  });
}

/**
 * @typedef {Object} InternalElementRuntimeProperties
 * @property {boolean} [$connectedCallbackCalledProperty]
 * @property {Set<function(CustomElement, DecoratorMetadataObject): void>} [$initialisersProperty]
 * @property {Set<function(CustomElement, DecoratorMetadataObject): void>} [$disposalsProperty]
 */

/**
 * @param {CustomElementClass} classConstructor
 */
function initialiseProperties(classConstructor) {
  classConstructor.prototype.$connectedCallbackCalled =
    /**
     * @this {CustomElement & InternalElementRuntimeProperties}
     */
    function () {
      return this.$connectedCallbackCalledProperty ?? false;
    };
  classConstructor.prototype.$setConnectedCallbackCalled =
    /**
     * @this {CustomElement & InternalElementRuntimeProperties}
     * @param {boolean} value
     */
    function (value) {
      this.$connectedCallbackCalledProperty = value;
    };
  classConstructor.prototype.$initialisers =
    /**
     * @this {CustomElement & InternalElementRuntimeProperties}
     */
    function () {
      return (this.$initialisersProperty ??= new Set());
    };
  classConstructor.prototype.$disposals =
    /**
     * @this {CustomElement & InternalElementRuntimeProperties}
     */
    function () {
      return (this.$disposalsProperty ??= new Set());
    };
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 */
function initialiseConnectedCallback(classConstructor, metadata) {
  const connectedCallback = classConstructor.prototype.connectedCallback;
  classConstructor.prototype.connectedCallback = function () {
    bindActions(this);
    this.$initialisers?.().forEach((initialise) => {
      initialise(this, metadata);
    });
    this.$initialisers?.().clear();
    connectedCallback?.call(this);
    this.$setConnectedCallbackCalled?.(true);
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
      // If Element has attributes in HTML, then for each of them attributeChangedCallback method
      // will be called during parsing phase (before connectedCallback method). At this time
      // children and the rest of the document after this element are not yet initialised,
      // so we usually want to skip those calls.
      if (this.$connectedCallbackCalled?.()) {
        if (oldValue !== newValue) {
          callAttributeWatchers(this, name, metadata);
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
    this.$disposals?.().forEach((dispose) => {
      dispose(this, metadata);
    });
    this.$disposals?.().clear();
    this.$setConnectedCallbackCalled?.(false);
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
