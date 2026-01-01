/**
 * @import { IncomingMessage } from "node:http";
 */

import { env } from "node:process";

import { HttpMethod } from "./route.js";

/**
 * @typedef {{ $?: Record<string, any> }} CustomDataContainer
 */

/**
 * @enum {typeof PredefinedCustomDataKey[keyof typeof PredefinedCustomDataKey]}
 */
export const PredefinedCustomDataKey = Object.freeze({
  Url: "url",
  Method: "method",
  Parameters: "parameters",
});

/**
 * @param {IncomingMessage & CustomDataContainer} request
 * @returns {URL}
 */
export function extractUrl(request) {
  /**
   * @type {URL | undefined}
   */
  let url = request.$?.[PredefinedCustomDataKey.Url];

  if (url == null) {
    url = new URL(request.url ?? "/", `http://${env.HOST ?? "localhost"}`);
    assignCustomData(request, PredefinedCustomDataKey.Url, url);
  }

  return url;
}

/**
 * @template A
 * @param {IncomingMessage & CustomDataContainer} request
 * @param {string} key
 * @param {A} data
 * @param {boolean} [force]
 */
export function assignCustomData(request, key, data, force = false) {
  request.$ ??= {};

  if (!(key in request.$) || force) {
    request.$[key] = data;
  }
}

/**
 * @param {IncomingMessage & CustomDataContainer} request
 * @returns {Record<string, string>}
 */
export function extractParameters(request) {
  return request.$?.[PredefinedCustomDataKey.Parameters] ?? {};
}

/**
 * @param {IncomingMessage & CustomDataContainer} request
 * @returns {HttpMethod}
 */
export function extractMethod(request) {
  const method =
    /**
     * @type {HttpMethod | undefined}
     */
    (request.method?.toLowerCase());

  return method ?? HttpMethod.Get;
}
