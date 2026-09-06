/**
 * @typedef {Object} Interceptor
 * @property {|
 *  function(
 *    function(): Response | Promise<Response>
 *  ): Response | Promise<Response>
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
