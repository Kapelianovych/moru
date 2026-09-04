/**
 * @import { SessionResponse } from "./handler.js";
 */

/**
 * @typedef {Object} Interceptor
 * @property {|
 *  function(
 *    function(): SessionResponse | Promise<SessionResponse>
 *  ): SessionResponse | Promise<SessionResponse>
 * } intercept
 */

/**
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Interceptor} InterceptorConstructor
 */

/**
 * @template {Array<any>} Args
 */
export function Interceptor() {
  /**
   * @param {InterceptorConstructor<Args>} target
   * @param {ClassDecoratorContext<InterceptorConstructor<Args>>} context
   */
  return (target, context) => {};
}
