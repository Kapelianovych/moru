/**
 * @import { RequestHandler } from './handle.js';
 */

import { extractPathParameters, pathToRegExp } from "./path.js";
import {
  extractUrl,
  extractMethod,
  assignCustomData,
  PredefinedCustomDataKey,
} from "./request.js";

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
 * @typedef {Object} RouteOptions
 * @property {HttpMethod} method
 * @property {string} path
 * @property {RequestHandler} handler
 * @property {boolean} [matchWholeUrl]
 */

/**
 * @param {RouteOptions} options
 * @returns {RequestHandler}
 */
export function route(options) {
  const pathRegExp = pathToRegExp(options.path, options.matchWholeUrl ?? true);

  return async (request, response, next) => {
    const url = extractUrl(request);
    const requestMethod = extractMethod(request);

    if (requestMethod === options.method && pathRegExp.test(url.pathname)) {
      const parameters = extractPathParameters(pathRegExp, url.pathname);
      assignCustomData(
        request,
        PredefinedCustomDataKey.Parameters,
        parameters,
        true,
      );
      await options.handler(request, response, next);
    } else {
      next();
    }
  };
}
