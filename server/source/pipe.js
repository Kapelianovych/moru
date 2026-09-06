/**
 * @import { ContainerStoredInstance, ContainerStoredInstanceMetadata } from "./container.js";
 */

import { inferKeyFromClass } from "./key.js";

/**
 * @template A
 * @template B
 * @typedef {Object} PipeOwnProperties
 * @property {function(A): B} transform
 */

/**
 * @template A
 * @template B
 * @typedef {ContainerStoredInstance & PipeOwnProperties<A, B>} Pipe
 */

/**
 * @template A
 * @template B
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Pipe<A, B>} PipeConstructor
 */

/**
 * @typedef {Partial<ContainerStoredInstanceMetadata>} PipeOptions
 */

/**
 * @template A
 * @template B
 * @template {Array<any>} Args
 * @param {PipeOptions} [options]
 */
export function Pipe(options) {
  /**
   * @param {PipeConstructor<A, B, Args>} target
   * @param {ClassDecoratorContext<PipeConstructor<A, B, Args>>} context
   */
  return (target, context) => {
    context.metadata.key = options?.key ?? inferKeyFromClass(target, /pipe$/i);
    context.metadata.singleton = options?.singleton;
  };
}
