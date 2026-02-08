/**
 * @import { InterceptorConstructor } from "./interceptor.js";
 */

import { AsyncLocalStorage } from "node:async_hooks";

/**
 * @typedef {Object} HandlerSession
 * @property {URLPattern} pattern
 */

/**
 * @type {AsyncLocalStorage<HandlerSession>}
 */
export const handlerSession = new AsyncLocalStorage();

/**
 * @enum {typeof HttpStatus[keyof typeof HttpStatus]}
 */
export const HttpStatus = Object.freeze({
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  ContentTooLarge: 413,
  URITooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  Iamateapot: 418,
  MisdirectedRequest: 421,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HTTPVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
});

/**
 * @enum {typeof HttpMethod[keyof typeof HttpMethod]}
 */
export const HttpMethod = Object.freeze({
  Get: "GET",
  Put: "PUT",
  Head: "HEAD",
  Post: "POST",
  Patch: "PATCH",
  Trace: "TRACE",
  Delete: "DELETE",
  Connect: "CONNECT",
  Options: "OPTIONS",
});

/**
 * @typedef {Object} HandlerOptions
 * @property {HttpMethod} method
 * @property {string | URLPattern | URLPatternInit} pattern
 * @property {Array<InterceptorConstructor<PossibleResponseValue, PossibleResponseValue>>} [interceptors]
 */

/**
 * @typedef {typeof SkipHandler | Response} PossibleResponseValue
 */

export const SkipHandler = Symbol("handler.skip");

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
   * @param {HandlerConstructor<T>} _
   * @param {ClassDecoratorContext<HandlerConstructor<T>>} context
   */
  return (_, context) => {
    context.metadata.pattern =
      typeof options.pattern === "string"
        ? new URLPattern({ pathname: options.pattern })
        : options.pattern instanceof URLPattern
          ? options.pattern
          : new URLPattern(options.pattern);
    context.metadata.method = options.method;
    context.metadata.interceptors = options.interceptors;
  };
}
