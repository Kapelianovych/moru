/**
 * @import { IncomingMessage, ServerResponse } from "node:http";
 *
 * @import { Interceptor } from "./interceptor.js";
 * @import { Service, Container } from "./service.js";
 * @import { Handler, PossibleResponseValue } from "./handler.js";
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { handlerSession } from "./handler.js";

/**
 * @typedef {Object} SessionContext
 * @property {URL} url
 * @property {string} sessionId
 * @property {Container} container
 * @property {ServerResponse} response
 * @property {IncomingMessage} request
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
 * @template {string | undefined} A
 * @param {undefined} _
 * @param {ClassFieldDecoratorContext<TargetContainingInstance, A>} context
 */
export function group(_, context) {
  /**
   * @param {A} initial
   * @returns {A}
   */
  return (initial) => {
    const store = session.getStore();
    const handlerStore = handlerSession.getStore();

    if (store != null && handlerStore != null) {
      const parameterName = inferName(context);

      const result =
        /**
         * @type {URLPatternResult}
         */
        (handlerStore.pattern.exec(store.url));

      for (const name in result) {
        if (name === "inputs") {
          continue;
        }

        const groups =
          result[
            /**
             * @type {Exclude<keyof URLPatternResult, 'inputs'>}
             */
            (name)
          ].groups;

        if (parameterName in groups) {
          return (
            /**
             * @type {A}
             */
            (groups[parameterName])
          );
        }
      }

      return initial;
    } else {
      return initial;
    }
  };
}

/**
 * @param {undefined} _
 * @param {ClassFieldDecoratorContext<TargetContainingInstance, string | Array<string> | undefined>} context
 */
export function header(_, context) {
  /**
   * @param {string | Array<string> | undefined} initial
   * @return {string | Array<string> | undefined}
   */
  return (initial) => {
    const store = session.getStore();

    if (store != null) {
      let headerName = inferName(context);

      headerName = headerName.replaceAll(/[A-Z]/g, (letter) => {
        return `-${letter.toLowerCase()}`;
      });

      return store.request.headers[headerName];
    } else {
      return initial;
    }
  };
}

/**
 * @template {ArrayBuffer | string | Record<string, unknown>} A
 * @param {undefined} _
 * @param {ClassFieldDecoratorContext<TargetContainingInstance, Promise<A>>} context
 */
export function body(_, context) {
  /**
   * @param {Promise<A>} initial
   */
  return async (initial) => {
    const store = session.getStore();

    if (store != null) {
      const type = store.request.headers["content-type"] ?? "text/plain";

      const text = await store.request.reduce((accumulator, data) => {
        return accumulator + data;
      }, "");

      if (type === "application/json") {
        return JSON.parse(text);
      } else if (type === "application/x-www-form-urlencoded") {
        return new URLSearchParams(text).entries().reduce(
          /**
           * @param {Record<string, string | Array<string>>} accumulator
           */
          (accumulator, [key, value]) => {
            if (accumulator[key] != null) {
              // Handle multiple values
              if (!Array.isArray(accumulator[key])) {
                accumulator[key] = [accumulator[key]];
              }
              accumulator[key].push(value);
            } else {
              accumulator[key] = value;
            }
            return accumulator;
          },
          {},
        );
      } else if (type.includes("text/")) {
        return text;
      } else {
        return new TextEncoder().encode(text).buffer;
      }
    } else {
      return initial;
    }
  };
}
