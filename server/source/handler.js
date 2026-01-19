/**
 * @import { Stream } from "node:stream";
 * @import { OutgoingHttpHeaders } from "node:http";
 *
 * @import { InterceptorConstructor } from "./interceptor.js";
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { pathToRegExp } from "./path.js";

/**
 * @enum {typeof HttpStatus[keyof typeof HttpStatus]}
 */
export const HttpStatus = Object.freeze({
  Ok: 200,
  NotFound: 404,
});

/**
 * @enum {typeof HttpMethod[keyof typeof HttpMethod]}
 */
export const HttpMethod = Object.freeze({
  Get: "get",
  Put: "put",
  Post: "post",
  Patch: "patch",
  Delete: "delete",
  Options: "options",
});

/**
 * @typedef {Object} HandlerOptions
 * @property {string} path
 * @property {HttpMethod} method
 * @property {Array<InterceptorConstructor<PossibleResponseValue, PossibleResponseValue>>} [interceptors]
 */

/**
 * @typedef {|
 *   string
 *   | number
 *   | boolean
 *   | undefined
 *   | void
 *   | null
 *   | Array<unknown>
 *   | Record<string | number, unknown>
 *   | Stream
 *   | typeof SkipHandler
 *   | HandlerResponse
 * } PossibleResponseValue
 */

export const SkipHandler = Symbol("handler.skip");

export class HandlerResponse {
  /**
   * @type {HttpStatus}
   */
  statusCode;
  /**
   * @type {Exclude<PossibleResponseValue, typeof SkipHandler | HandlerResponse>}
   */
  payload;
  /**
   * @type {OutgoingHttpHeaders}
   */
  headers;

  /**
   * @param {HttpStatus} statusCode
   * @param {OutgoingHttpHeaders} headers
   * @param {Exclude<PossibleResponseValue, typeof SkipHandler | HandlerResponse>} payload
   */
  constructor(statusCode, headers, payload) {
    this.statusCode = statusCode;
    this.headers = headers;
    this.payload = payload;
  }
}

/**
 * @template {PossibleResponseValue} [T=PossibleResponseValue]
 * @typedef {Object} Handler
 * @property {function(): T | Promise<T>} handle
 */

/**
 * @template {PossibleResponseValue} [T=PossibleResponseValue]
 * @template {Array<any>} [Args=Array<any>]
 * @typedef {new (...args: Args) => Handler<T>} HandlerConstructor
 */

/**
 * @template {PossibleResponseValue} T
 * @param {HandlerOptions} options
 */
export function handler(options) {
  /**
   * @param {HandlerConstructor<T>} target
   * @param {ClassDecoratorContext<HandlerConstructor<T>>} context
   */
  return (target, context) => {
    context.metadata.path = pathToRegExp(options.path);
    context.metadata.method = options.method;
    context.metadata.interceptors = options.interceptors;
  };
}

/**
 * @typedef {Object} HandlerSession
 * @property {RegExp} path
 */

/**
 * @type {AsyncLocalStorage<HandlerSession>}
 */
export const handlerSession = new AsyncLocalStorage();
