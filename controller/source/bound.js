/**
 * @template A
 * @template {(this: A, ...args: Array<any>) => any} F
 * @param {F} method
 * @param {ClassMethodDecoratorContext<A, F>} context
 * @returns {F}
 */
export function bound(method, context) {
  /**
   * @type {function(...unknown): unknown}
   */
  let fn = method;

  context.addInitializer(function () {
    fn = method.bind(this);
  });

  return /** @type {F} */ (
    function (...args) {
      return fn.apply(this, args);
    }
  );
}
