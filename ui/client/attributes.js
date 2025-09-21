/**
 * @import { CustomElement, CustomElementClass } from "./controller.js";
 */

import { toKebabCase } from "./to-kebab-case.js";
import { hookIntoProperty } from "./hook-into-property.js";

/**
 * @typedef {Object} AttributeDescriptor
 * @property {string} name
 * @property {function(this: CustomElement): void} initialise
 * @property {Set<string | symbol>} observers
 */

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement>} context
 */
export function attribute(_, context) {
  const attributeName = createAttributeName(context.name);

  const attributes =
    /**
     * @type {Map<string, AttributeDescriptor>}
     */
    (context.metadata.attributes ??= new Map());

  let get =
    /**
     * @this {CustomElement}
     * @returns {unknown}
     */
    function () {
      return this.getAttribute(attributeName) || "";
    };
  let set =
    /**
     * @this {CustomElement}
     * @param {unknown} value
     */
    function (value) {
      this.setAttribute(attributeName, String(value));
    };

  /**
   * @type {unknown}
   */
  let attributeDefaultValue;

  attributes.set(attributeName, {
    name: attributeName,
    initialise() {
      set.call(this, attributeDefaultValue);
    },
    observers: new Set(),
  });

  context.addInitializer(function () {
    if (typeof attributeDefaultValue === "number") {
      get =
        /**
         * @this {CustomElement}
         */
        function () {
          return Number(this.getAttribute(attributeName) || 0);
        };
    } else if (typeof attributeDefaultValue === "boolean") {
      get =
        /**
         * @this {CustomElement}
         */
        function () {
          return this.hasAttribute(attributeName);
        };
      set =
        /**
         * @this {CustomElement}
         */
        function (value) {
          this.toggleAttribute(attributeName, Boolean(value));
        };
    }

    hookIntoProperty(this, context.name, get, set);
  });

  /**
   * @param {unknown} value
   */
  return (value) => {
    attributeDefaultValue = value;
  };
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 */
export function initialiseObservedAttributes(classConstructor, metadata) {
  const observedAttributes = (classConstructor.observedAttributes ??= []);

  /**
   * @type {Array<AttributeDescriptor> | undefined}
   */
  (metadata.attributes)?.forEach(({ name }) => {
    observedAttributes.push(name);
  });
}

/**
 * @param {CustomElement} classInstance
 * @param {DecoratorMetadataObject} metadata
 */
export function initialiseAttributeDefaultValues(classInstance, metadata) {
  const attributes =
    /**
     * @type {Array<AttributeDescriptor> | undefined}
     */
    (metadata.attributes);

  attributes?.forEach(({ name, initialise }) => {
    if (!classInstance.hasAttribute(name)) {
      initialise.call(classInstance);
    }
  });
}

/**
 * @param {string | symbol} attribute
 */
export function watch(attribute) {
  const name = createAttributeName(attribute);

  /**
   * @param {unknown} _
   * @param {ClassMethodDecoratorContext<CustomElement>} context
   */
  return (_, context) => {
    context.addInitializer(function () {
      const attributes =
        /**
         * @type {Map<string, AttributeDescriptor> | undefined}
         */
        (context.metadata.attributes);
      const properties =
        /**
         * @type {Map<string | symbol, Set<string | symbol>> | undefined}
         */
        (context.metadata.properties);

      attributes?.get(name)?.observers.add(context.name);
      properties?.get(attribute)?.add(context.name);
    });
  };
}

/**
 * @param {CustomElement} classInstance
 * @param {string} attribute
 * @param {DecoratorMetadataObject} metadata
 */
export function callAttributeWatchers(classInstance, attribute, metadata) {
  const attributes =
    /**
     * @type {Map<string,AttributeDescriptor>}
     */
    (metadata.attributes);

  attributes.get(attribute)?.observers.forEach((methodName) => {
    // @ts-expect-error we expect method to exist
    classInstance[methodName]();
  });
}

/**
 * @param {string | symbol} propertyName
 * @returns {string}
 */
function createAttributeName(propertyName) {
  return toKebabCase(String(propertyName));
}
