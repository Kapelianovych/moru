/**
 * @import { CustomElement, CustomElementClass } from "./controller.js";
 */

import { toKebabCase } from "./to-kebab-case.js";

/**
 * @typedef {Object} AttributeDescriptor
 * @property {string} name
 * @property {function(): unknown} defaultValue
 * @property {PropertyDescriptor} descriptor
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
     * @type {Map<string,AttributeDescriptor>}
     */
    (context.metadata.attributes ??= new Map());

  /**
   * @type {PropertyDescriptor}
   */
  const descriptor = {
    configurable: true,
    /**
     * @this {CustomElement}
     */
    get() {
      return this.getAttribute(attributeName) || "";
    },
    /**
     * @this {CustomElement}
     */
    set(value) {
      this.setAttribute(attributeName, value || "");
    },
  };

  /**
   * @type {unknown}
   */
  let attributeDefaultValue;

  attributes.set(attributeName, {
    name: attributeName,
    descriptor,
    defaultValue() {
      return attributeDefaultValue;
    },
    observers: new Set(),
  });

  context.addInitializer(function () {
    Reflect.defineProperty(this, context.name, descriptor);
  });

  /**
   * @param {unknown} value
   */
  return (value) => {
    attributeDefaultValue = value;
    const defaultValueType = typeof value;

    if (defaultValueType === "number") {
      descriptor.get =
        /**
         * @this {CustomElement}
         */
        function () {
          return Number(this.getAttribute(attributeName) || 0);
        };
      descriptor.set =
        /**
         * @this {CustomElement}
         */
        function (value) {
          this.setAttribute(attributeName, value);
        };
    } else if (defaultValueType === "boolean") {
      descriptor.get =
        /**
         * @this {CustomElement}
         */
        function () {
          return this.hasAttribute(attributeName);
        };
      descriptor.set =
        /**
         * @this {CustomElement}
         */
        function (value) {
          this.toggleAttribute(attributeName, value);
        };
    }
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

  attributes?.forEach(({ name, descriptor, defaultValue }) => {
    if (!classInstance.hasAttribute(name)) {
      // @ts-expect-error set method is definitely defined above
      descriptor.set.call(classInstance, defaultValue());
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
         * @type {Map<string,AttributeDescriptor>}
         */
        (context.metadata.attributes);

      attributes.get(name)?.observers.add(context.name);
    });
  };
}

/**
 * @param {CustomElement} classInstance
 * @param {string} attribute
 * @param {DecoratorMetadataObject} metadata
 */
export function callWatchers(classInstance, attribute, metadata) {
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
