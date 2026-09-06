/**
 * @import { Pipe } from "./pipe.js";
 * @import { Guard } from "./guard.js";
 * @import { Handler } from "./handler.js";
 * @import { Interceptor } from "./interceptor.js";
 * @import {
 *  ContainerStoredInstance,
 *  ContainerStoredInstanceMetadata,
 *  ContainerStoredInstanceConstructor
 * } from "./container.js";
 */

import { inferKeyFromClass } from "./key.js";
import { resolveSessionContext } from "./session.js";

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

/**
 * @typedef {Service | Guard<any> | Handler | Interceptor | Pipe<any, any>} InjectableTarget
 */

/**
 * @template {ContainerStoredInstanceConstructor<ContainerStoredInstance>} A
 * @param {A} constructor
 */
export function Inject(constructor) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, InstanceType<A>>} context
   */
  return (_, context) => {
    return () => {
      const { container } = resolveSessionContext();
      const { singleton } =
        container.extractStoredInstanceMetadata(constructor);
      if (singleton === false) {
        context.metadata.singleton ??= false;
      }
      return container.resolve(constructor);
    };
  };
}
