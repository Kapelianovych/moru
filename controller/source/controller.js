import { bindActions } from "./actions.js";
import { toKebabCase } from "./to-kebab-case.js";
import {
  callAttributeWatchers,
  initialiseObservedAttributes,
} from "./attributes.js";

/**
 * @typedef {HTMLElement & {
 *   $connectedCallbackCalled: boolean;
 *   $initialisers: Set<function(CustomElement, DecoratorMetadataObject): void>;
 *   $disposals: Set<function(CustomElement, DecoratorMetadataObject): void>;
 *   connectedCallback?(): void;
 *   attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
 *   disconnectedCallback?(): void;
 *   adoptedCallback?(): void;
 * }} CustomElement
 */

/**
 * @typedef {{
 *   new (): CustomElement;
 *   prototype: CustomElement;
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
 * @param {CustomElementClass} classConstructor
 */
function initialiseProperties(classConstructor) {
  classConstructor.prototype.$connectedCallbackCalled = false;
  classConstructor.prototype.$initialisers = new Set();
  classConstructor.prototype.$disposals = new Set();
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 */
function initialiseConnectedCallback(classConstructor, metadata) {
  const connectedCallback = classConstructor.prototype.connectedCallback;
  classConstructor.prototype.connectedCallback = function () {
    bindActions(this);
    this.$initialisers.forEach((initialise) => {
      initialise(this, metadata);
    });
    this.$initialisers.clear();
    connectedCallback?.call(this);
    this.$connectedCallbackCalled = true;
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
      if (this.$connectedCallbackCalled) {
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
    this.$disposals.forEach((dispose) => {
      dispose(this, metadata);
    });
    this.$disposals.clear();
    this.$connectedCallbackCalled = false;
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
