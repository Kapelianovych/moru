/**
 * @import { GuardConstructor } from "./guard.js";
 * @import { InterceptorConstructor } from "./interceptor.js";
 */

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
 * @template Error
 * @typedef {Object} HandlerOptions
 * @property {HttpMethod} method
 * @property {GuardConstructor<Error, []>} [guard]
 * @property {string | URLPattern | URLPatternInit} pattern
 * @property {Array<InterceptorConstructor<[]>>} [interceptors]
 */

/**
 * @typedef {typeof TryNext | Response} SessionResponse
 */

export const TryNext = Symbol("handler.try-next");

/**
 * @typedef {Object} Handler
 * @property {function(): SessionResponse | Promise<SessionResponse>} handle
 */

/**
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Handler} HandlerConstructor
 */

/**
 * @template Error
 * @typedef {Object} HandlerMetadata
 * @property {HttpMethod} method
 * @property {URLPattern} pattern
 * @property {GuardConstructor<Error, []> | undefined} guard
 * @property {Array<InterceptorConstructor<[]>> | undefined} interceptors
 */

/**
 * @template {Array<any>} Args
 * @template Error
 * @param {HandlerOptions<Error>} options
 */
export function Handler(options) {
  /**
   * @param {HandlerConstructor<Args>} _
   * @param {ClassDecoratorContext<HandlerConstructor<Args>>} context
   */
  return (_, context) => {
    context.metadata.guard = options.guard;
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
