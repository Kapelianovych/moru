/**
 * @import { SessionContext } from "./session.js";
 * @import { GuardConstructor } from "./guard.js";
 * @import { InterceptorConstructor } from "./interceptor.js";
 * @import { Adapter, AdapterConstructor } from "./adapter.js";
 * @import { ContainerStoredInstanceFactory } from "./container.js";
 * @import { HandlerConstructor, HandlerMetadata } from "./handler.js";
 */

import { Container } from "./container.js";
import { DefaultGuard } from "./default-guard.js";
import { runInSessionContext } from "./session.js";
import { HttpStatus, TryNextResponse } from "./handler.js";

// @ts-expect-error Not all runtimes support decorators yet.
// https://babeljs.io/docs/babel-plugin-proposal-decorators#symbolmetadata-notes
Symbol.metadata ??= Symbol.for("Symbol.metadata");

/**
 * @template ApplicationRequest
 * @template ApplicationResponse
 * @template Error
 * @typedef {Object} ApplicationOptions
 * @property {GuardConstructor<Error, []>} [guard]
 * @property {Array<HandlerConstructor<[]>>} handlers
 * @property {Array<InterceptorConstructor<[]>>} [interceptors]
 * @property {Array<ContainerStoredInstanceFactory>} [factories]
 * @property {AdapterConstructor<ApplicationRequest, ApplicationResponse, []>} adapter
 */

/**
 * @template ApplicationRequest
 * @template ApplicationResponse
 * @template Error
 */
export class Application {
  /**
   * @type {GuardConstructor<Error, []>}
   */
  #guard;
  /**
   * @type {Adapter<ApplicationRequest, ApplicationResponse>}
   */
  #adapter;
  /**
   * @type {Array<HandlerConstructor<[]>>}
   */
  #handlers;
  /**
   * @type {Array<InterceptorConstructor<[]>>}
   */
  #interceptors;
  /**
   * @type {Container}
   */
  #container;
  /**
   * @param {ApplicationOptions<ApplicationRequest, ApplicationResponse, Error>} options
   */
  constructor(options) {
    this.#guard = options.guard ?? DefaultGuard;
    this.#adapter = new options.adapter();
    this.#handlers = options.handlers;
    this.#container = new Container(options.factories ?? []);
    this.#interceptors = options.interceptors ?? [];
  }
  /**
   * @param {HandlerConstructor<[]>} handlerConstructor
   */
  #extractHandlerMetadata(handlerConstructor) {
    return (
      /**
       * @type {HandlerMetadata<Error>}
       */
      (handlerConstructor[Symbol.metadata])
    );
  }
  /**
   * @param {HandlerConstructor<[]>} handlerConstructor
   * @param {Request} request
   */
  #matches(handlerConstructor, request) {
    const handlerMetadata = this.#extractHandlerMetadata(handlerConstructor);
    return (
      handlerMetadata.method === request.method &&
      handlerMetadata.pattern.test(request.url)
    );
  }
  /**
   * @param {HandlerConstructor<[]>} handlerConstructor
   * @param {string} sessionId
   * @param {Request} webRequest
   */
  async #run(handlerConstructor, sessionId, webRequest) {
    const handlerMetadata = this.#extractHandlerMetadata(handlerConstructor);
    /**
     * @type {SessionContext}
     */
    const sessionContext = {
      cache: {},
      request: webRequest,
      sessionId,
      container: this.#container,
      handlerUrlPattern: handlerMetadata.pattern,
    };
    const run = this.#interceptors
      .concat(handlerMetadata.interceptors)
      .reduceRight(
        (accumulator, interceptorConstructor) => {
          return () => {
            return runInSessionContext(
              sessionContext,
              () => new interceptorConstructor(),
            ).intercept(accumulator);
          };
        },
        () => {
          return runInSessionContext(
            sessionContext,
            () => new handlerConstructor(),
          ).handle();
        },
      );

    try {
      return await run();
    } catch (error) {
      const guardConstructor = handlerMetadata.guard ?? this.#guard;
      return runInSessionContext(
        sessionContext,
        () => new guardConstructor(),
      ).catch(
        /**
         * @type {Error}
         */
        (error),
      );
    }
  }
  build() {
    /**
     * @param {ApplicationRequest} request
     * @param {ApplicationResponse} response
     * @returns {Promise<void>}
     */
    return async (request, response) => {
      const sessionId = crypto.randomUUID();
      const webRequest = this.#adapter.createWebRequest(request);

      let handled = false;

      for (const handlerConstructor of this.#handlers) {
        if (this.#matches(handlerConstructor, webRequest)) {
          const webResponse = await this.#run(
            handlerConstructor,
            sessionId,
            webRequest,
          );

          if (webResponse !== TryNextResponse) {
            this.#adapter.respondWith(webResponse, response);
            handled = true;
            break;
          }
        }
      }

      if (!handled) {
        this.#adapter.respondWith(
          new Response(undefined, { status: HttpStatus.NotFound }),
          response,
        );
      }

      this.#container.dispose(sessionId);
    };
  }
  reset() {
    this.#container.dispose("all");
  }
}
