/**
 * @import { ReadableStream } from "node:stream/web";
 * @import { ServerResponse, OutgoingHttpHeaders } from "node:http";
 */

import { Readable } from "node:stream";

/**
 * @param {Response} webResponse
 * @param {ServerResponse} response
 */
export function respond(webResponse, response) {
  response.writeHead(webResponse.status, createServerHeaders(webResponse));
  if (webResponse.body == null) {
    response.end();
  } else {
    Readable.fromWeb(
      /**
       * @type {ReadableStream}
       */
      (webResponse.body),
    ).pipe(response);
  }
}

/**
 * @param {Response} webResponse
 */
function createServerHeaders(webResponse) {
  /**
   * @type {OutgoingHttpHeaders}
   */
  const headers = {};

  webResponse.headers.forEach((value, name) => {
    if (name in headers) {
      if (!Array.isArray(headers[name])) {
        headers[name] = [
          /**
           * @type {string}
           */
          (headers[name]),
        ];
      }
      headers[name].push(value);
    } else {
      headers[name] = value;
    }
  });

  return headers;
}
