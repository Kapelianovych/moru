/**
 * @import { GuardConstructor } from "./guard.js";
 * @import { AdapterConstructor } from "./adapter.js";
 * @import { ServiceConstructor } from "./service.js";
 * @import { InterceptorConstructor } from "./interceptor.js";
 * @import { HandlerConstructor, SessionResponse } from "./handler.js";
 */

/**
 * @template {Array<any>} Args
 * @overload
 * @param {HandlerConstructor<Args>} constructor
 * @param {Args} args
 * @returns {HandlerConstructor<[]>}
 *
 * @template {Array<any>} Args
 * @overload
 * @param {InterceptorConstructor<Args>} constructor
 * @param {Args} args
 * @returns {InterceptorConstructor<[]>}
 *
 * @template {Array<any>} Args
 * @overload
 * @param {ServiceConstructor<Args>} constructor
 * @param {Args} args
 * @returns {ServiceConstructor<[]>}
 *
 * @template ApplicationRequest
 * @template ApplicationResponse
 * @template {Array<any>} Args
 * @overload
 * @param {AdapterConstructor<ApplicationRequest, ApplicationResponse, Args>} constructor
 * @param {Args} args
 * @returns {AdapterConstructor<ApplicationRequest, ApplicationResponse, []>}
 *
 * @template Error
 * @template {Array<any>} Args
 * @overload
 * @param {GuardConstructor<Error, Args>} constructor
 * @param {Args} args
 * @returns {GuardConstructor<Error, []>}
 *
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
