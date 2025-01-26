/**
 * @import { Options } from './options.js';
 * @import { VirtualFile } from './virtual-file.js';
 */

/**
 * @param {string} url
 * @param {Array<string>} extensions
 * @returns {string | void}
 */
export function getFileNameFrom(url, extensions) {
  return new RegExp(`\\/?([^/]+)\.(?:${extensions.join("|")})$`).exec(url)?.[1];
}

/**
 * @private
 * @typedef {(relativeUrl: string) => string} UrlResolver
 *
 * @private
 * @typedef {Object} UrlStartingPoint
 * @property {string} current URL of the file relative to which any URL is resolved
 *   by this {@link UrlCreator}.
 *
 * A URL resolver function with a predefined relative point.
 * @typedef {UrlResolver & UrlStartingPoint} UrlCreator
 */

/**
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {UrlCreator}
 */
export function createUrlCreator(file, options) {
  const urlCreator = (/** @type {string} */ relativeUrl) =>
    options.resolveUrl(file, relativeUrl);
  urlCreator.current = file.url;
  return urlCreator;
}
