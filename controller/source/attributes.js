/**
 * @import { CustomElement, CustomElementClass } from "./controller.js";
 */

import { toKebabCase } from "./to-kebab-case.js";
import { hookIntoProperty } from "./hook-into-property.js";

/**
 * @typedef {Object} AttributeDescriptor
 * @property {string} name
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

  attributes.set(attributeName, {
    name: attributeName,
    observers: new Set(),
  });

  context.addInitializer(function () {
    const attributeDefaultValue = context.access.get(this);

    let get =
      /**
       * @this {CustomElement}
       * @returns {unknown}
       */
      function () {
        return (
          this.getAttribute(attributeName) || String(attributeDefaultValue)
        );
      };
    let set =
      /**
       * @this {CustomElement}
       * @param {unknown} value
       */
      function (value) {
        this.setAttribute(attributeName, String(value));
      };

    if (typeof attributeDefaultValue === "number") {
      get =
        /**
         * @this {CustomElement}
         */
        function () {
          return Number(
            this.getAttribute(attributeName) || attributeDefaultValue,
          );
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

    if (!this.hasAttribute(attributeName)) {
      set.call(this, attributeDefaultValue);
    }

    hookIntoProperty(this, context.name, get, set);
  });
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
     * @type {Map<string, AttributeDescriptor>}
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
