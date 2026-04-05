/**
 * @import { parseHtml } from '@moru/core';
 */

/**
 * @typedef {Object} MoruEntries
 * @property {string} suffix
 * @property {Array<string>} include
 * @property {Array<string>} exclude
 */

/**
 * @typedef {Object} TransformOptions
 * @property {string} url
 * @property {string} filePath
 */

/**
 * @typedef {Object} PluginOptions
 * @property {MoruEntries} entries
 * @property {function(ReturnType<typeof parseHtml>, TransformOptions): void | Promise<void>} [transform]
 */

export {};
