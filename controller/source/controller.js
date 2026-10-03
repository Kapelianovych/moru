/**
 * @import { InjectableConstructor } from "./container.js";
 */

import { Container } from "./container.js";
import { bindActions } from "./actions.js";
import { toKebabCase } from "./to-kebab-case.js";
import { callWatchers } from "./watch.js";
import { InternalController } from "./internal-controller.js";
import { initialiseObservedAttributes } from "./attributes.js";

// @ts-expect-error Not all runtimes support this symbol yet.
// https://babeljs.io/docs/babel-plugin-proposal-decorators#symbolmetadata-notes
Symbol.metadata ??= Symbol.for("Symbol.metadata");

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
 * @typedef {Object} ControllerOptions
 * @property {string} [tag]
 * @property {Array<[InjectableConstructor, InjectableConstructor]>} [factories]
 */

/**
 * @param {ControllerOptions} [options]
 */
export function Controller(options) {
  /**
   * @param {CustomElementClass} target
   * @param {ClassDecoratorContext<CustomElementClass>} context
   */
  return (target, context) => {
    context.addInitializer(function () {
      initialiseObservedAttributes(this, context.metadata);
      initialiseConnectedCallback(this, context.metadata, options?.factories);
      initialiseAttributeChangedCallback(this, context.metadata);
      initialiseDisconnectedCallback(this, context.metadata);
      register(this, options?.tag);
    });
  };
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 * @param {ControllerOptions['factories'] | undefined} factories
 */
function initialiseConnectedCallback(classConstructor, metadata, factories) {
  const connectedCallback = classConstructor.prototype.connectedCallback;
  classConstructor.prototype.connectedCallback = function () {
    Container.tryToDefineOnIfMissing(this, factories);
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
 * @param {string} [tag]
 */
function register(classConstructor, tag) {
  const name =
    tag ?? toKebabCase(classConstructor.name).replace(/-element$/, "");
  if (window.customElements.get(name) == null) {
    window.customElements.define(name, classConstructor);
    // @ts-expect-error
    window[classConstructor.name] = window.customElements.get(name);
  }
}
