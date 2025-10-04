import { bindActions } from "./actions.js";
import { toKebabCase } from "./to-kebab-case.js";
import { initialiseConsumers } from "./context.js";
import {
  callAttributeWatchers,
  initialiseAttributeDefaultValues,
  initialiseObservedAttributes,
} from "./attributes.js";

/**
 * @typedef {HTMLElement & {
 *   $connectedCallbackCalled?: boolean;
 *   $disposals?: Set<VoidFunction>;
 *   $registeredConsumersPerContext?: Map<string | symbol, Set<function(unknown): void>>;
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
    initialiseObservedAttributes(classConstructor, context.metadata);
    initialiseConnectedCallback(classConstructor, context.metadata);
    initialiseAttributeChangedCallback(classConstructor, context.metadata);
    initialiseDisconnectedCallback(classConstructor);

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
    initialiseAttributeDefaultValues(this, metadata);
    initialiseConsumers(this, metadata);
    bindActions(this);
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
 */
function initialiseDisconnectedCallback(classConstructor) {
  const disconnectedCallback = classConstructor.prototype.disconnectedCallback;
  classConstructor.prototype.disconnectedCallback = function () {
    this.$registeredConsumersPerContext?.clear();
    this.$disposals?.forEach((dispose) => {
      dispose();
    });
    this.$disposals?.clear();
    disconnectedCallback?.call(this);

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
