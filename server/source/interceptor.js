/**
 * @import { PossibleResponseValue } from "./handler.js";
 */

/**
 * @template {PossibleResponseValue} [T=PossibleResponseValue]
 * @template {PossibleResponseValue} [V=PossibleResponseValue]
 * @typedef {Object} Interceptor
 * @property {function(<R extends T | Promise<T>>() => R): V | Promise<V>} intercept
 */

/**
 * @template {PossibleResponseValue} [T=PossibleResponseValue]
 * @template {PossibleResponseValue} [V=PossibleResponseValue]
 * @template {Array<any>} [Args=Array<any>]
 * @typedef {new (...args: Args) => Interceptor<T, V>} InterceptorConstructor
 */

/**
 * @template {PossibleResponseValue} [T=PossibleResponseValue]
 * @template {PossibleResponseValue} [V=PossibleResponseValue]
 * @template {Array<any>} [Args=Array<any>]
 */
export function interceptor() {
  /**
   * @param {InterceptorConstructor<T, V, Args>} target
   * @param {ClassDecoratorContext<InterceptorConstructor<T, V, Args>>} context
   */
  return (target, context) => {};
}
