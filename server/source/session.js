/**
 * @import { Container } from "./container.js";
 * @import { PipeConstructor } from "./pipe.js";
 * @import { InjectableTarget } from "./container.js";
 */

import { runPipe } from "./pipe.js";
import { RequestBodyPipe } from "./request-body-pipe.js";
import { inferKeyFromProperty } from "./key.js";

/**
 * @typedef {Object} SessionContext
 * @property {string} sessionId
 * @property {Request} request
 * @property {Container} container
 * @property {URLPattern} handlerUrlPattern
 * @property {Record<string, any>} cache
 */

/**
 * @type {SessionContext | undefined}
 */
let sessionContext;

/**
 * @returns {SessionContext}
 */
export function resolveSessionContext() {
  if (sessionContext == null) {
    throw new Error(
      "Session context is not initialised or resolving is happening outside application context.",
    );
  } else {
    return sessionContext;
  }
}

/**
 * @template A
 * @param {SessionContext} context
 * @param {function(): A} fn
 * @returns {A}
 */
export function runInSessionContext(context, fn) {
  let currentContext = sessionContext;
  sessionContext = context;
  const result = fn();
  sessionContext = currentContext;
  return result;
}

/**
 * @template A
 * @typedef {Object} GroupOptions
 * @property {string} [name]
 * @property {PipeConstructor<any, A, string | undefined, []>} [pipe]
 */

/**
 * @template [A=string | undefined]
 * @param {GroupOptions<A>} [options]
 */
export function Group(options) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, A>} context
   */
  return (_, context) => {
    context.metadata.singleton ??= false;
    /**
     * @param {A} initial
     * @returns {A}
     */
    return (initial) => {
      const { request, handlerUrlPattern } = resolveSessionContext();
      const parameterName = options?.name ?? inferKeyFromProperty(context);
      const result =
        /**
         * @type {URLPatternResult}
         */
        (handlerUrlPattern.exec(request.url));

      for (const name in result) {
        // That property never contains any pattern value.
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
          const value = groups[parameterName];
          if (options?.pipe == null) {
            return (
              /**
               * @type {A}
               */
              (value)
            );
          } else {
            return runPipe(value, options.pipe);
          }
        }
      }

      return initial;
    };
  };
}

/**
 * @template A
 * @typedef {Object} HeaderOptions
 * @property {string} [name]
 * @property {PipeConstructor<any, A, string | null, []>} [pipe]
 */

/**
 * @template [A=string | null]
 * @param {HeaderOptions<A>} [options]
 */
export function Header(options) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, A>} context
   */
  return (_, context) => {
    context.metadata.singleton ??= false;
    /**
     * @return {A}
     */
    return () => {
      const { request } = resolveSessionContext();
      const headerName =
        options?.name ??
        inferKeyFromProperty(context).replaceAll(/[A-Z]/g, (letter) => {
          return `-${letter.toLowerCase()}`;
        });
      const value = request.headers.get(headerName);
      if (options?.pipe == null) {
        return (
          /**
           * @type {A}
           */
          (value)
        );
      } else {
        return runPipe(value, options.pipe);
      }
    };
  };
}

/**
 * @template A
 * @param {PipeConstructor<any, Promise<A>, Request, []>} [bodyParser]
 */
export function Body(bodyParser = RequestBodyPipe) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, Promise<A>>} context
   */
  return (_, context) => {
    context.metadata.singleton ??= false;
    /**
     * @returns {Promise<A>}
     */
    return () => {
      const { cache, request } = resolveSessionContext();
      if (!("_requestBody" in cache)) {
        cache._requestBody = runPipe(request, bodyParser);
      }
      return cache._requestBody;
    };
  };
}
