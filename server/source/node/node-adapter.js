/**
 * @import { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from "node:http";
 */

import { Readable } from "node:stream";

import { Adapter } from "../adapter.js";
import { HttpMethod } from "../handler.js";

@Adapter()
export class NodeAdapter {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Forwarded
   */
  static #FORWARDED_VALUE_RE =
    /by=(?<by>.+);for=(?<for>.+);host=(?<host>.+);proto=(?<proto>.+)/;

  /**
   * @param {Response} webResponse
   * @param {ServerResponse} response
   */
  respondWith(webResponse, response) {
    response.writeHead(
      webResponse.status,
      this.#createServerHeaders(webResponse),
    );
    if (webResponse.body == null) {
      response.end();
    } else {
      Readable.fromWeb(webResponse.body).pipe(response);
    }
  }

  /**
   * @param {Response} webResponse
   */
  #createServerHeaders(webResponse) {
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

  /**
   * @param {IncomingMessage} request
   */
  createWebRequest(request) {
    const body =
      request.method === HttpMethod.Get || request.method === HttpMethod.Head
        ? null
        : Readable.toWeb(request);
    return new Request(this.#createUrl(request), {
      method: request.method,
      headers: this.#createHeaders(request),
      body,
    });
  }

  /**
   * @param {IncomingMessage} request
   */
  #createHeaders(request) {
    const headers = new Headers();

    for (const name in request.headers) {
      const value = request.headers[name];

      if (Array.isArray(value)) {
        value.forEach((value) => {
          headers.append(name, value);
        });
      } else if (value != null) {
        headers.set(name, value);
      }
    }

    return headers;
  }

  /**
   * @param {IncomingMessage} request
   */
  #createUrl(request) {
    if (request.headers.forwarded != null) {
      const match =
        /**
         * @type {RegExpExecArray}
         */
        (NodeAdapter.#FORWARDED_VALUE_RE.exec(request.headers.forwarded));
      const { proto, host } =
        /**
         * @type {Record<string, string>}
         */
        (match.groups);

      return `${proto}://${host}${request.url}`;
    } else {
      const protocol =
        "encrypted" in request.socket && request.socket.encrypted
          ? "https"
          : "http";
      return `${protocol}://${request.headers.host}${request.url}`;
    }
  }
}
