/**
 * @import { Service as _Service } from "./service.js";
 * @import { Interceptor as _Interceptor } from "./interceptor.js";
 * @import {
 *   Handler as _Handler,
 *   PossibleResponseValue as _PossibleResponseValue
 * } from "./handler.js";
 */

/**
 * @template {PossibleResponseValue} A
 * @typedef {_Handler<A>} Handler
 */

/**
 * @typedef {_PossibleResponseValue} PossibleResponseValue
 */

/**
 * @typedef {_Service} Service
 */

/**
 * @template {PossibleResponseValue} A
 * @template {PossibleResponseValue} B
 * @typedef {_Interceptor<A, B>} Interceptor
 */

export { factory } from "./factory.js";
export { interceptor } from "./interceptor.js";
export { Application } from "./application.js";
export { service, inject } from "./service.js";
export { StaticFilesHandler } from "./files.js";
export { parameter, query, header } from "./session.js";
export {
  handler,
  HttpMethod,
  HttpStatus,
  SkipHandler,
  HandlerResponse,
} from "./handler.js";
