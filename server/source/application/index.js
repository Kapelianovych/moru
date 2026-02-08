/**
 * @import { RequestListener } from "node:http";
 *
 * @import { ServiceConstructor } from "../service.js";
 * @import { InterceptorConstructor } from "../interceptor.js";
 * @import { HandlerConstructor, PossibleResponseValue } from "../handler.js";
 */

import { randomUUID } from "node:crypto";

import { session } from "../session.js";
import { respond } from "./web-response.js";
import { Container } from "../service.js";
import { handlerSession } from "../handler.js";
import { createWebRequest } from "./web-request.js";
import { HttpStatus, SkipHandler } from "../handler.js";

// @ts-expect-error the runtime does not support decorators yet.
Symbol.metadata ??= Symbol("symbol.metadata");

/**
 * @typedef {Object} ApplicationOptions
 * @property {Array<ServiceConstructor>} [services]
 * @property {Array<HandlerConstructor<PossibleResponseValue, []>>} handlers
 */

export class Application {
  /**
   * @type {Array<HandlerConstructor<PossibleResponseValue, []>>}
   */
  #handlers;
  /**
   * @type {Container}
   */
  #container;

  /**
   * @param {ApplicationOptions} options
   */
  constructor(options) {
    this.#handlers = options.handlers;
    this.#container = new Container(options.services ?? []);
  }

  /**
   * @param {HandlerConstructor<PossibleResponseValue>} handlerConstructor
   */
  #extractHandlerMetadata(handlerConstructor) {
    /**
     * @typedef {Object} HandlerMetadata
     * @property {string} method
     * @property {URLPattern} pattern
     * @property {Array<InterceptorConstructor<PossibleResponseValue, PossibleResponseValue>> | undefined} interceptors
     */

    return (
      /**
       * @type {HandlerMetadata}
       */
      (handlerConstructor[Symbol.metadata])
    );
  }

  /**
   * @param {HandlerConstructor<PossibleResponseValue>} handlerConstructor
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
   * @param {HandlerConstructor<PossibleResponseValue>} handlerConstructor
   */
  #run(handlerConstructor) {
    const handlerMetadata = this.#extractHandlerMetadata(handlerConstructor);

    const handle = () => {
      return new handlerConstructor().handle();
    };

    return handlerSession.run(
      {
        pattern: handlerMetadata.pattern,
      },
      handlerMetadata.interceptors?.reduceRight(
        (accumulator, interceptorConstructor) => {
          return () => {
            return new interceptorConstructor().intercept(
              // @ts-expect-error parameter is generic.
              accumulator,
            );
          };
        },
        handle,
      ) ?? handle,
    );
  }

  /**
   * @returns {RequestListener}
   */
  build() {
    return (request, response) => {
      const sessionId = randomUUID();
      const webRequest = createWebRequest(request);

      return session.run(
        {
          cache: {},
          request: webRequest,
          sessionId,
          container: this.#container,
        },
        async () => {
          let handled = false;

          for (const handlerConstructor of this.#handlers) {
            if (this.#matches(handlerConstructor, webRequest)) {
              try {
                const webResponse = await this.#run(handlerConstructor);
                if (webResponse !== SkipHandler) {
                  respond(webResponse, response);
                  handled = true;
                }
              } catch {
                // Stop handling a request when first unhandled error has been caught.
                handled = true;
                response.statusCode = HttpStatus.InternalServerError;
                response.end();
              }

              if (handled) {
                break;
              }
            }
          }

          if (!handled) {
            response.statusCode = HttpStatus.NotFound;
            response.end();
          }

          this.#container.dispose(sessionId);
        },
      );
    };
  }

  dispose() {
    this.#container.dispose("all");
  }
}
