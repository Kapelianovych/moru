/**
 * @import {
 *  ContainerStoredInstance,
 *  ContainerStoredInstanceMetadata,
 * } from "./container.js";
 */

import { inferKeyFromClass } from "./key.js";

/**
 * @typedef {Partial<ContainerStoredInstanceMetadata>} ServiceOptions
 */

/**
 * @typedef {ContainerStoredInstance} Service
 */

/**
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Service} ServiceConstructor
 */

/**
 * @typedef {ContainerStoredInstanceMetadata} ServiceMetadata
 */

/**
 * @template {Array<any>} Args
 * @param {ServiceOptions} [options]
 */
export function Service(options) {
  /**
   * @param {ServiceConstructor<Args>} target
   * @param {ClassDecoratorContext<ServiceConstructor<Args>>} context
   */
  return (target, context) => {
    context.metadata.key =
      options?.key ?? inferKeyFromClass(target, /service$/i);
    context.metadata.singleton = options?.singleton;
  };
}
