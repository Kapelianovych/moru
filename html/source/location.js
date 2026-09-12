/**
 * @import { VirtualFile } from './virtual-file.js';
 * @import { Options, ResolverContext, URI } from './options.js';
 */

/**
 * @param {URI} uri
 * @param {Array<string>} extensions
 * @returns {string | void}
 */
export function getFileNameFrom(uri, extensions) {
  return new RegExp(`\\/?([^/]+)\.(?:${extensions.join("|")})$`).exec(uri)?.[1];
}

/**
 * @private
 * @typedef {function(URI, ResolverContext): URI} UrlResolver
 *
 * @private
 * @typedef {Object} UrlStartingPoint
 * @property {URI} current URL of the file relative to which any URL is resolved
 *   by this {@link UriCreator}.
 *
 * A URL resolver function with a predefined relative point.
 * @typedef {UrlResolver & UrlStartingPoint} UriCreator
 */

/**
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {UriCreator}
 */
export function createUriCreator(file, options) {
  const urlCreator =
    /**
     * @param {URI} relativeUrl
     * @param {ResolverContext} context
     */
    (relativeUrl, context) => options.resolveUri(file, relativeUrl, context);
  urlCreator.current = file.uri;
  return urlCreator;
}
