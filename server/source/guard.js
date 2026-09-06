/**
 * @template Error
 * @typedef {Object} Guard
 * @property {function(Error): Response | Promise<Response>} catch
 */

/**
 * @template Error
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Guard<Error>} GuardConstructor
 */

/**
 * @template Error
 * @template {Array<any>} Args
 */
export function Guard() {
  /**
   * @param {GuardConstructor<Error, Args>} target
   * @param {ClassDecoratorContext<GuardConstructor<Error, Args>>} context
   */
  return (target, context) => {};
}
