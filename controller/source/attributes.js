/**
 * @import { CustomElement, CustomElementClass } from "./controller.js";
 */

import { createName } from "./create-name.js";

/**
 * @template {boolean | string | number | null | undefined} A
 * @param {string} [name]
 */
export function Attribute(name) {
  /**
   * @param {ClassAccessorDecoratorTarget<CustomElement, A>} target
   * @param {ClassAccessorDecoratorContext<CustomElement, A>} context
   * @returns {ClassAccessorDecoratorResult<CustomElement, A>}
   */
  return (target, context) => {
    const attributeName = name ?? createName(context.name);
    const attributes =
      /**
       * @type {Map<string, Set<ClassMethodDecoratorContext['access']['get']>>}
       */
      (context.metadata.attributes ??= new Map());

    attributes.set(attributeName, new Set());

    return {
      get() {
        return convertAttributeValue(
          this,
          attributeName,
          target.get.call(this),
        );
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
 * @template {string | number | boolean | null | undefined} A
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
 * @template {string | number | boolean | null | undefined} A
 * @param {CustomElement} instance
 * @param {string} attribute
 * @param {A} value
 * @param {A} defaultValue
 * @returns {void}
 */
function setAttributeValue(instance, attribute, value, defaultValue) {
  if (typeof defaultValue === "boolean") {
    instance.toggleAttribute(attribute, Boolean(value));
  } else if (value == null) {
    instance.removeAttribute(attribute);
  } else {
    instance.setAttribute(attribute, String(value));
  }
}
