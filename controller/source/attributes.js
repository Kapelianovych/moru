/**
 * @import { CustomElement, CustomElementClass } from "./controller.js";
 */

import { toKebabCase } from "./to-kebab-case.js";

/**
 * @template {boolean | string | number} A
 * @param {ClassAccessorDecoratorTarget<CustomElement, A>} target
 * @param {ClassAccessorDecoratorContext<CustomElement, A>} context
 * @returns {ClassAccessorDecoratorResult<CustomElement, A>}
 */
export function attribute(target, context) {
  const attributeName = toKebabCase(String(context.name));

  const attributes =
    /**
     * @type {Map<string, Set<ClassMethodDecoratorContext['access']['get']>>}
     */
    (context.metadata.attributes ??= new Map());

  attributes.set(attributeName, new Set());

  return {
    get() {
      return convertAttributeValue(this, attributeName, target.get.call(this));
    },
    set(value) {
      setAttributeValue(this, attributeName, value, target.get.call(this));
    },
    init(defaultValue) {
      if (this.hasAttribute(attributeName)) {
        return convertAttributeValue(this, attributeName, defaultValue);
      } else {
        setAttributeValue(this, attributeName, defaultValue, defaultValue);

        return defaultValue;
      }
    },
  };
}

/**
 * @param {CustomElementClass} classConstructor
 * @param {DecoratorMetadataObject} metadata
 */
export function initialiseObservedAttributes(classConstructor, metadata) {
  const observedAttributes = (classConstructor.observedAttributes ??= []);

  /**
   * @type {Map<string, Set<ClassMethodDecoratorContext['access']['get']>> | undefined}
   */
  (metadata.attributes)?.forEach((_, name) => {
    observedAttributes.push(name);
  });
}

/**
 * @template {string | number | boolean} A
 * @param {CustomElement} instance
 * @param {string} attribute
 * @param {A} defaultValue
 * @returns {A}
 */
function convertAttributeValue(instance, attribute, defaultValue) {
  switch (typeof defaultValue) {
    case "number":
      return /** @type {A} */ (
        Number(instance.getAttribute(attribute) || defaultValue)
      );
    case "boolean":
      return /** @type {A} */ (instance.hasAttribute(attribute));
    default:
      return (
        /** @type {A} */ (instance.getAttribute(attribute)) || defaultValue
      );
  }
}

/**
 * @template {string | number | boolean} A
 * @param {CustomElement} instance
 * @param {string} attribute
 * @param {A} value
 * @param {A} defaultValue
 * @returns {void}
 */
function setAttributeValue(instance, attribute, value, defaultValue) {
  if (typeof defaultValue === "boolean") {
    instance.toggleAttribute(attribute, Boolean(value));
  } else {
    instance.setAttribute(attribute, String(value));
  }
}
