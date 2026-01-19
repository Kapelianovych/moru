/**
 * @import { IncomingMessage, ServerResponse, RequestListener } from "node:http";
 *
 * @import { ServiceConstructor } from "./service.js";
 * @import { InterceptorConstructor } from "./interceptor.js";
 * @import { HandlerConstructor, PossibleResponseValue } from "./handler.js";
 */

import { Stream } from "node:stream";

import { session } from "./session.js";
import { Container } from "./service.js";
import {
  HandlerResponse,
  handlerSession,
  HttpStatus,
  SkipHandler,
} from "./handler.js";

// @ts-expect-error the runtime does not support decorators yet.
Symbol.metadata ??= Symbol("symbol.metadata");

/**
 * @typedef {Object} ApplicationOptions
 * @property {Array<ServiceConstructor>} [services]
 * @property {Array<HandlerConstructor<PossibleResponseValue, []>>} handlers
 */

/**
 * @template {typeof IncomingMessage} Request
 * @template {typeof ServerResponse} Response
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
   * @param {HandlerConstructor<PossibleResponseValue, []>} handlerConstructor
   * @param {DecoratorMetadataObject} handlerMetadata
   */
  #runHandler(handlerConstructor, handlerMetadata) {
    const interceptors =
      /**
       * @type {Array<InterceptorConstructor<PossibleResponseValue, PossibleResponseValue>> | undefined}
       */
      (handlerMetadata.interceptors) ?? [];

    const handler = new handlerConstructor();

    const run = interceptors.reduceRight(
      (accumulator, interceptorConstructor) => {
        const interceptor = new interceptorConstructor();

        return () => {
          return interceptor.intercept(
            // @ts-expect-error parameter is generic.
            accumulator,
          );
        };
      },
      () => {
        return handler.handle();
      },
    );

    return run();
  }

  /**
   * @param {HandlerConstructor<PossibleResponseValue, []>} handlerConstructor
   * @param {InstanceType<Request>} request
   * @param {InstanceType<Response>} response
   */
  async #runHandlerIfMatched(handlerConstructor, request, response) {
    const handlerMetadata =
      /**
       * @type {DecoratorMetadataObject}
       */
      (handlerConstructor[Symbol.metadata]);

    if (
      handlerMetadata.method === request.method?.toLowerCase() &&
      /**
       * @type {RegExp}
       */
      (handlerMetadata.path).test(
        /**
         * @type {string}
         */
        (request.url),
      )
    ) {
      /**
       * @type {PossibleResponseValue}
       */
      const userResponse = await handlerSession.run(
        {
          path:
            /**
             * @type {RegExp}
             */
            (handlerMetadata.path),
        },
        () => {
          return this.#runHandler(handlerConstructor, handlerMetadata);
        },
      );

      if (userResponse === SkipHandler) {
        return false;
      } else if (userResponse instanceof HandlerResponse) {
        response.statusCode = userResponse.statusCode;

        for (const headerName in userResponse.headers) {
          const headerValue = userResponse.headers[headerName];

          if (headerValue != null) {
            response.setHeader(headerName, headerValue);
          }
        }

        this.#sendUserResponse(response, userResponse.payload);
      } else {
        response.statusCode = HttpStatus.Ok;
        this.#sendUserResponse(response, userResponse);
      }

      return true;
    } else {
      return false;
    }
  }

  /**
   * @param {InstanceType<Response>} response
   * @param {Exclude<PossibleResponseValue, HandlerResponse | SkipHandler>} userResponse
   */
  #sendUserResponse(response, userResponse) {
    if (userResponse instanceof Stream) {
      userResponse.pipe(response);
    } else {
      if (!response.hasHeader("content-type") && userResponse !== undefined) {
        response.setHeader("content-type", "application/json");
      }

      response.write(JSON.stringify(userResponse));
      response.end();
    }
  }

  /**
   * @returns {RequestListener<Request, Response>}
   */
  build() {
    return async (request, response) => {
      const sessionId = crypto.randomUUID();

      await session.run(
        { sessionId, request, response, container: this.#container },
        async () => {
          let handled = false;

          for (const handlerConstructor of this.#handlers) {
            handled = await this.#runHandlerIfMatched(
              handlerConstructor,
              request,
              response,
            );

            if (handled) {
              break;
            }
          }

          this.#container.dispose("session");

          if (!handled) {
            response.statusCode = HttpStatus.NotFound;
            response.end();
          }
        },
      );
    };
  }

  dispose() {
    this.#container.dispose("all");
  }
}
