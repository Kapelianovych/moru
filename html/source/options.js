/**
 * @import { Diagnostics } from "./diagnostics.js";
 * @import { VirtualFile } from "./virtual-file.js";
 */

/**
 * @typedef {Map<PropertyKey, unknown>} BuildStore
 */

/**
 * @typedef {'browser' | 'node'} URIConsumer
 */

/**
 * @typedef {Object} ResolverContext
 * @property {URIConsumer} consumer
 */

/**
 * @typedef {string} URI
 */

/**
 * @typedef {Object} Options
 * @property {Record<string, unknown>} exports Exported values from a compiled files.
 *   It will be filled by the compiler.
 * @property {Record<string, unknown>} properties Data for the top-level HTML component.
 * @property {BuildStore} buildStore Store object for a single compilation unit.
 *   It must not be shared between multiple units, though it can be prepopulated with some values which are shared.
 * @property {Diagnostics} diagnostics
 * @property {function(VirtualFile, URI, ResolverContext): URI} resolveUri Resolves URIs relatively to the provided
 *   file. When relative URI is `build`, it **must not** resolve it, but return as is.
 * @property {function(URI): Promise<string>} readFileContent
 * @property {function(URI, string): Promise<void>} writeFileContent
 * @property {function(URI): Promise<Record<string, unknown>>} dynamicallyImportJsFile
 */

export {};
