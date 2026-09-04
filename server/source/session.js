/**
 * @import { Container, InjectableTarget } from "./service.js";
 */

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
 * @param {SessionContext} nextContext
 * @returns {function(): void}
 */
export function setSessionContext(nextContext) {
  let currentContext = sessionContext;
  sessionContext = nextContext;
  return () => {
    sessionContext = currentContext;
  };
}

/**
 * @param {ClassFieldDecoratorContext<InjectableTarget>} context
 * @returns {string}
 */
export function inferName(context) {
  const name = String(context.name);
  return context.private ? name.slice(1) : name;
}

/**
 * @template {string | undefined} A
 * @param {string} [name]
 */
export function Group(name) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, A>} context
   */
  return (_, context) => {
    /**
     * @param {A} initial
     * @returns {A}
     */
    return (initial) => {
      const { request, handlerUrlPattern } = resolveSessionContext();
      const parameterName = name ?? inferName(context);
      const result =
        /**
         * @type {URLPatternResult}
         */
        (handlerUrlPattern.exec(request.url));

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
    };
  };
}

/**
 * @template {string | null} A
 * @param {string} [name]
 */
export function Header(name) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, A>} context
   */
  return (_, context) => {
    /**
     * @return {A}
     */
    return () => {
      const { request } = resolveSessionContext();
      const headerName =
        name ??
        inferName(context).replaceAll(/[A-Z]/g, (letter) => {
          return `-${letter.toLowerCase()}`;
        });
      return (
        /**
         * @type {A}
         */
        (request.headers.get(headerName))
      );
    };
  };
}

/**
 * @template A
 * @param {function(Request): Promise<A>} [parse]
 */
export function Body(parse = parseBody) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, Promise<A>>} context
   */
  return (_, context) => {
    /**
     * @returns {Promise<A>}
     */
    return () => {
      const { cache, request } = resolveSessionContext();
      if (!("_requestBody" in cache)) {
        cache._requestBody = parse(request);
      }
      return cache._requestBody;
    };
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
