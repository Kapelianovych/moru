/**
 * @import { ServiceConstructor } from "./service.js";
 * @import { InterceptorConstructor } from "./interceptor.js";
 * @import { HandlerConstructor, PossibleResponseValue } from "./handler.js";
 */

/**
 * @template {PossibleResponseValue} T
 * @template {Array<any>} Args
 * @overload
 * @param {HandlerConstructor<T, Args>} constructor
 * @param {Args} args
 * @returns {HandlerConstructor<T, []>}
 */
/**
 * @template {PossibleResponseValue} T
 * @template {PossibleResponseValue} V
 * @template {Array<any>} Args
 * @overload
 * @param {InterceptorConstructor<T, V, Args>} constructor
 * @param {Args} args
 * @returns {InterceptorConstructor<T, V, []>}
 */
/**
 * @template {Array<any>} Args
 * @overload
 * @param {ServiceConstructor<Args>} constructor
 * @param {Args} args
 * @returns {ServiceConstructor<[]>}
 */
/**
 * @param {new (...args: Array<any>) => object} constructor
 * @param {Array<any>} args
 * @returns {new () => object}
 */
export function factory(constructor, args) {
  return class {
    static get [Symbol.metadata]() {
      return constructor[Symbol.metadata];
    }

    constructor() {
      return new constructor(...args);
    }
  };
}
