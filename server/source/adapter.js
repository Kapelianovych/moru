/**
 * @template ApplicationRequest
 * @template ApplicationResponse
 * @typedef {Object} Adapter
 * @property {function(ApplicationRequest): Request} createWebRequest
 * @property {function(Response, ApplicationResponse): void} respondWith
 */

/**
 * @template ApplicationRequest
 * @template ApplicationResponse
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Adapter<ApplicationRequest, ApplicationResponse>} AdapterConstructor
 */

/**
 * @template ApplicationRequest
 * @template ApplicationResponse
 * @template {Array<any>} Args
 */
export function Adapter() {
  /**
   * @param {AdapterConstructor<ApplicationRequest, ApplicationResponse, Args>} target
   * @param {ClassDecoratorContext<AdapterConstructor<ApplicationRequest, ApplicationResponse, Args>>} context
   */
  return (target, context) => {};
}
