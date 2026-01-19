/**
 * @import { IncomingMessage, ServerResponse } from "node:http";
 *
 * @import { Interceptor } from "./interceptor.js";
 * @import { Service, Container } from "./service.js";
 * @import { Handler, PossibleResponseValue } from "./handler.js";
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { handlerSession } from "./handler.js";
import { extractPathParameters } from "./path.js";

/**
 * @typedef {Object} SessionContext
 * @property {string} sessionId
 * @property {Container} container
 * @property {IncomingMessage} request
 * @property {ServerResponse} response
 */

/**
 * @type {AsyncLocalStorage<SessionContext>}
 */
export const session = new AsyncLocalStorage();

/**
 * @typedef {Service | Handler<PossibleResponseValue> | Interceptor<PossibleResponseValue, PossibleResponseValue>} TargetContainingInstance
 */

/**
 * @param {ClassFieldDecoratorContext<TargetContainingInstance>} context
 * @returns {string}
 */
function inferName(context) {
  const name = String(context.name);

  return context.private ? name.slice(1) : name;
}

/**
 * @param {string} [name]
 */
export function parameter(name) {
  /**
   * @param {undefined} target
   * @param {ClassFieldDecoratorContext<TargetContainingInstance, string>} context
   */
  return (target, context) => {
    /**
     * @param {string} initial
     * @returns {string}
     */
    return (initial) => {
      const store = session.getStore();
      const handlerStore = handlerSession.getStore();

      if (store != null && handlerStore != null) {
        const parameterName = name ?? inferName(context);

        const params = extractPathParameters(
          handlerStore.path,
          /**
           * @type {string}
           */
          (store.request.url),
        );

        return params[parameterName];
      } else {
        return initial;
      }
    };
  };
}
/**
 * @param {string} [name]
 */
export function query(name) {
  /**
   * @param {undefined} target
   * @param {ClassFieldDecoratorContext<TargetContainingInstance, string | Array<string> | undefined>} context
   */
  return (target, context) => {
    /**
     * @param {string | Array<string> | undefined} initial
     * @returns {string | Array<string> | undefined}
     */
    return (initial) => {
      const store = session.getStore();

      if (store != null) {
        const queryParameterName = name ?? inferName(context);

        const url = new URL(
          /**
           * @type {string}
           */
          (store.request.url),
          "http://localhost",
        );

        const values = url.searchParams.getAll(queryParameterName);

        if (values.length > 1) {
          return values;
        } else {
          return values[0];
        }
      } else {
        return initial;
      }
    };
  };
}

/**
 * @param {string} [name]
 */
export function header(name) {
  /**
   * @param {undefined} target
   * @param {ClassFieldDecoratorContext<TargetContainingInstance, string | Array<string> | undefined>} context
   */
  return (target, context) => {
    /**
     * @param {string | Array<string> | undefined} initial
     * @return {string | Array<string> | undefined}
     */
    return (initial) => {
      const store = session.getStore();

      if (store != null) {
        let headerName = name ?? inferName(context);

        headerName = headerName.replaceAll(/[A-Z]/g, (letter) => {
          return `-${letter.toLowerCase()}`;
        });

        return store.request.headers[headerName];
      } else {
        return initial;
      }
    };
  };
}
