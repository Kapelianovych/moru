/**
 * @import { IncomingMessage, ServerResponse, RequestListener } from "node:http";
 */

/**
 * @callback RequestHandler
 * @param {IncomingMessage} request
 * @param {ServerResponse<IncomingMessage>} response
 * @param {VoidFunction} next
 * @returns {void | Promise<void>}
 */

/**
 * @param  {...RequestHandler} handlers
 * @returns {RequestListener}
 */
export function handle(...handlers) {
  return async (request, response) => {
    let handled = true;
    const next = () => {
      handled = false;
    };

    for (const handler of handlers) {
      handled = true;

      await handler(request, response, next);

      if (handled) {
        break;
      }
    }

    if (!handled) {
      response.statusCode = 404;
      response.end();
    }
  };
}
