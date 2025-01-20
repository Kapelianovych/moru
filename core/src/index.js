/** @import { AnyNode } from 'domhandler'; */

/**
 * @import { UrlCreator as _UrlCreator } from "./location.js";
 * @import { VirtualFile as _VirtualFile } from "./virtual-file.js";
 * @import { HtmlVisitor as _HtmlVisitor } from './traverse-html.js';
 * @import { Options as _Options, BuildStore as _BuildStore, LocalThis as _LocalThis } from "./options.js";
 * @import {
 *   AnyMessage as _AnyMessage,
 *   Diagnostics as _Diagnostics,
 *   EmptyExplicitComponentAliasMessage as _EmptyExplicitComponentAliasMessage,
 *   ExternalBuildScriptMessage as _ExternalBuildScriptMessage,
 *   FailedBuildScriptExecutionMessage as _FailedBuildScriptExecutionMessage,
 *   FailedInHtmlExpressionExecutionMessage as _FailedInHtmlExpressionExecutionMessage,
 *   InvalidChildOfExecutableScriptMessage as _InvalidChildOfExecutableScriptMessage,
 *   InvalidChildOfStyleElementMessage as _InvalidChildOfStyleElementMessage,
 *   InvalidExpandResultMessage as _InvalidExpandResultMessage,
 *   InvalidFileNameMessage as _InvalidFileNameMessage,
 *   InvalidImportComponentPositionMessage as _InvalidImportComponentPositionMessage,
 *   Location as _Location,
 *   Message as _Message,
 *   MissingExportedValueFromBuildMessage as _MissingExportedValueFromBuildMessage,
 *   NonIterableEachAttributeMessage as _NonIterableEachAttributeMessage,
 *   ProhibitedReservedComponentRemappingMessage as _ProhibitedReservedComponentRemappingMessage,
 *   SingleElseElementMessage as _SingleElseElementMessage,
 *   SingleElseIfElementMessage as _SingleElseIfElementMessage,
 *   UnsupportedBuildScriptReexportingMessage as _UnsupportedBuildScriptReexportingMessage,
 *   JsSyntaxErrorMessage as _JsSyntaxErrorMessage,
 *   NotDefinedPortalNameMessage as _NotDefinedPortalNameMessage,
 *   ReferenceToNonExistentPortalMessage as _ReferenceToNonExistentPortalMessage,
 *   NotDefinedExportNameMessage as _NotDefinedExportNameMessage,
 *   MissingExportedValueFromHtmlDefinitionMessage as _MissingExportedValueFromHtmlDefinitionMessage,
 *   InvalidExportElementPositionMessage as _InvalidExportElementPositionMessage,
 *   ComponentMissingExportMessage as _ComponentMissingExportMessage,
 *   MessageTag
 * } from "./diagnostics.js";
 */

/**
 * @template {AnyNode} A
 * @typedef {_HtmlVisitor<A>} HtmlVisitor
 */

/**
 * @template {MessageTag} Tag
 * @typedef {_Message<Tag>} Message
 */

/**
 * @typedef {_VirtualFile} VirtualFile
 * @typedef {_UrlCreator} UrlCreator
 * @typedef {_Options} Options
 * @typedef {_BuildStore} BuildStore
 * @typedef {_LocalThis} LocalThis
 * @typedef {_AnyMessage} AnyMessage
 * @typedef {_Diagnostics} Diagnostics
 * @typedef {_EmptyExplicitComponentAliasMessage} EmptyExplicitComponentAliasMessage
 * @typedef {_ExternalBuildScriptMessage} ExternalBuildScriptMessage
 * @typedef {_FailedBuildScriptExecutionMessage} FailedBuildScriptExecutionMessage
 * @typedef {_FailedInHtmlExpressionExecutionMessage} FailedInHtmlExpressionExecutionMessage
 * @typedef {_InvalidChildOfExecutableScriptMessage} InvalidChildOfExecutableScriptMessage
 * @typedef {_InvalidChildOfStyleElementMessage} InvalidChildOfStyleElementMessage
 * @typedef {_InvalidExpandResultMessage} InvalidExpandResultMessage
 * @typedef {_InvalidFileNameMessage} InvalidFileNameMessage
 * @typedef {_InvalidImportComponentPositionMessage} InvalidImportComponentPositionMessage
 * @typedef {_Location} Location
 * @typedef {_MissingExportedValueFromBuildMessage} MissingExportedValueFromBuildMessage
 * @typedef {_NonIterableEachAttributeMessage} NonIterableEachAttributeMessage
 * @typedef {_ProhibitedReservedComponentRemappingMessage} ProhibitedReservedComponentRemappingMessage
 * @typedef {_SingleElseElementMessage} SingleElseElementMessage
 * @typedef {_SingleElseIfElementMessage} SingleElseIfElementMessage
 * @typedef {_UnsupportedBuildScriptReexportingMessage} UnsupportedBuildScriptReexportingMessage
 * @typedef {_JsSyntaxErrorMessage} JsSyntaxErrorMessage
 * @typedef {_NotDefinedPortalNameMessage} NotDefinedPortalNameMessage
 * @typedef {_ReferenceToNonExistentPortalMessage} ReferenceToNonExistentPortalMessage
 * @typedef {_NotDefinedExportNameMessage} NotDefinedExportNameMessage
 * @typedef {_MissingExportedValueFromHtmlDefinitionMessage} MissingExportedValueFromHtmlDefinitionMessage
 * @typedef {_InvalidExportElementPositionMessage} InvalidExportElementPositionMessage
 * @typedef {_ComponentMissingExportMessage} ComponentMissingExportMessage
 */

export { parseHtml } from "./parse-html.js";
export { MessageTag } from "./diagnostics.js";
export { compileHtml } from "./compile-html.js";
export { generateHtml } from "./generate-html.js";
export { traverseHtml } from "./traverse-html.js";
