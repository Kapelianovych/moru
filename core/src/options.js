/**
 * @import { Diagnostics } from "./diagnostics.js";
 * @import { VirtualFile } from "./virtual-file.js";
 */

/**
 * @typedef {Map<PropertyKey, unknown>} BuildStore
 */

/**
 * @typedef {Object} Options
 * @property {Record<string, unknown>} exports Exported values from a compiled files.
 *   It will be filled by the compiler.
 * @property {Record<string, unknown>} properties Data for the top-level HTML component.
 * @property {BuildStore} buildStore Store object for a single compilation unit.
 *   It must not be shared between multiple units, though it can be prepopulated with some values which are shared.
 * @property {Diagnostics} diagnostics
 * @property {(currentFile: VirtualFile, relativeUrl: string) => string} resolveUrl Resolves URLs when the current location is the same as URL of
 *   the {@link currentFile}. When {@link relativeUrl} is `build`, it **must not** resolve it, but return as is.
 * @property {(url: string) => Promise<string>} readFileContent
 * @property {(url: string, content: string) => Promise<void>} writeFileContent
 * @property {(url: string) => Promise<Record<string, unknown>>} dynamicallyImportJsFile
 */

export {};
