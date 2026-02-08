/**
 * @import { IncomingMessage } from "node:http";
 */

import { Readable } from "node:stream";

import { HttpMethod } from "../handler.js";

/**
 * @param {IncomingMessage} request
 */
export function createWebRequest(request) {
  const body =
    request.method === HttpMethod.Get || request.method === HttpMethod.Head
      ? null
      : /**
         * @type {ReadableStream}
         */
        (Readable.toWeb(request));

  return new Request(createUrl(request), {
    method: request.method,
    headers: createHeaders(request),
    body,
  });
}

/**
 * @param {IncomingMessage} request
 */
function createHeaders(request) {
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
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Forwarded
 */
const FORWARDED_VALUE_RE =
  /by=(?<by>.+);for=(?<for>.+);host=(?<host>.+);proto=(?<proto>.+)/;

/**
 * @param {IncomingMessage} request
 */
function createUrl(request) {
  if (request.headers.forwarded != null) {
    const match =
      /**
       * @type {RegExpExecArray}
       */
      (FORWARDED_VALUE_RE.exec(request.headers.forwarded));
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
