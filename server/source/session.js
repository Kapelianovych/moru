/**
 * @import { Interceptor } from "./interceptor.js";
 * @import { Service, Container } from "./service.js";
 * @import { Handler, PossibleResponseValue } from "./handler.js";
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { handlerSession } from "./handler.js";

/**
 * @typedef {Object} SessionContext
 * @property {string} sessionId
 * @property {Request} request
 * @property {Container} container
 * @property {Record<string, any>} cache
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
        (handlerStore.pattern.exec(store.request.url));

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
 * @template {string | null} A
 * @param {undefined} _
 * @param {ClassFieldDecoratorContext<TargetContainingInstance, A>} context
 */
export function header(_, context) {
  /**
   * @param {A} initial
   * @return {A}
   */
  return (initial) => {
    const store = session.getStore();

    if (store != null) {
      let headerName = inferName(context);

      headerName = headerName.replaceAll(/[A-Z]/g, (letter) => {
        return `-${letter.toLowerCase()}`;
      });

      return (
        /**
         * @type {A}
         */
        (store.request.headers.get(headerName))
      );
    } else {
      return initial;
    }
  };
}

/**
 * @template A
 * @param {undefined} _
 * @param {ClassFieldDecoratorContext<TargetContainingInstance, Promise<A>>} context
 */
export function body(_, context) {
  /**
   * @param {Promise<A>} initial
   */
  return (initial) => {
    const store = session.getStore();

    if (store != null) {
      store.cache.requestBody ??= parseBody(store.request);
      return store.cache.requestBody;
    } else {
      return initial;
    }
  };
}

/**
 * @param {Request} request
 */
function parseBody(request) {
  const type = request.headers.get("content-type") ?? "text/plain";

  if (type === "application/json") {
    return request.json();
  } else if (
    type === "application/x-www-form-urlencoded" ||
    type === "multipart/form-data"
  ) {
    return request.formData();
  } else if (type.includes("text/")) {
    return request.text();
  } else {
    return request.arrayBuffer();
  }
}
