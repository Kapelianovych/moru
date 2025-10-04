/**
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { Stringifiable } from "./type-utilities.js";
 */

/** @enum {typeof MessageTag[keyof typeof MessageTag]} */
export const MessageTag = Object.freeze({
  SingleElseElement: "SingleElseElement",
  SingleElseIfElement: "SingleElseIfElement",
  InvalidNameOfImportedComponent: "InvalidNameOfImportedComponent",
  UnsupportedBuildScriptReexporting: "UnsupportedBuildScriptReexporting",
  FailedBuildScriptExecution: "FailedBuildScriptExecution",
  ProhibitedReservedComponentRemapping: "ProhibitedReservedComponentRemapping",
  EmptyExplicitComponentAlias: "EmptyExplicitComponentAlias",
  InvalidImportComponentPosition: "InvalidImportComponentPosition",
  FailedInHtmlExpressionExecution: "FailedInHtmlExpressionExecution",
  InvalidExpandResult: "InvalidExpandResult",
  NonIterableEachAttribute: "NonIterableEachAttribute",
  MissingExportedValueFromBuild: "MissingExportedValueFromBuild",
  JsSyntaxError: "JsSyntaxError",
  NotDefinedPortalName: "NotDefinedPortalName",
  ReferenceToNonExistentPortal: "ReferenceToNonExistendPortal",
  NotDefinedExportName: "NotDefinedExportName",
  MissingExportedFromHtmlValueDefinition:
    "MissingExportedFromHtmlValueDefinition",
  InvalidExportElementPosition: "InvalidExportElementPosition",
  ComponentMissingExport: "ComponentMissingExport",
});

/**
 * @typedef {Object} Location
 * @property {number} start
 * @property {number} end
 */

/**
 * @template {MessageTag} T
 * @typedef {Object} Message
 * @property {T} tag
 * @property {Location} location
 * @property {VirtualFile} sourceFile
 */

/**
 * @typedef {Object} Diagnostics
 * @property {(message: AnyMessage) => void} publish
 */

/**
 * @typedef {SingleElseElementMessage
 *   | SingleElseIfElementMessage
 *   | InvalidNameOfImportedComponentMessage
 *   | UnsupportedBuildScriptReexportingMessage
 *   | FailedBuildScriptExecutionMessage
 *   | EmptyExplicitComponentAliasMessage
 *   | InvalidImportComponentPositionMessage
 *   | FailedInHtmlExpressionExecutionMessage
 *   | InvalidExpandResultMessage
 *   | NonIterableEachAttributeMessage
 *   | MissingExportedValueFromBuildMessage
 *   | JsSyntaxErrorMessage
 *   | NotDefinedPortalNameMessage
 *   | ReferenceToNonExistentPortalMessage
 *   | NotDefinedExportNameMessage
 *   | MissingExportedValueFromHtmlDefinitionMessage
 *   | InvalidExportElementPositionMessage
 *   | ComponentMissingExportMessage
 *   | ProhibitedReservedComponentRemappingMessage
 * } AnyMessage
 */

/**
 * @typedef {Message<typeof MessageTag.SingleElseElement>} SingleElseElementMessage
 */

/**
 * @typedef {Message<typeof MessageTag.SingleElseIfElement>} SingleElseIfElementMessage
 */

/**
 * @typedef {Message<typeof MessageTag.InvalidNameOfImportedComponent> & {
 *   url: string;
 *   allowedExtensions: Array<string>;
 * }} InvalidNameOfImportedComponentMessage
 */

/**
 * @typedef {Message<typeof MessageTag.UnsupportedBuildScriptReexporting> & {
 *   reexportLocation: Location;
 * }} UnsupportedBuildScriptReexportingMessage
 */

/**
 * @typedef {Message<typeof MessageTag.FailedBuildScriptExecution> & {
 *   error: unknown;
 * }} FailedBuildScriptExecutionMessage
 */

/**
 * @typedef {Message<typeof MessageTag.ProhibitedReservedComponentRemapping> & {
 *  remapFor: 'named-fragment' | 'custom-component'
 *  reservedComponentName: string,
 * }} ProhibitedReservedComponentRemappingMessage
 */

/**
 * @typedef {Message<typeof MessageTag.EmptyExplicitComponentAlias>} EmptyExplicitComponentAliasMessage
 */

/**
 * @typedef {Message<typeof MessageTag.InvalidImportComponentPosition>} InvalidImportComponentPositionMessage
 */

/**
 * @typedef {Message<typeof MessageTag.FailedInHtmlExpressionExecution> & {
 *   error: unknown;
 * }} FailedInHtmlExpressionExecutionMessage
 */

/**
 * @typedef {Message<typeof MessageTag.NonIterableEachAttribute> & {
 *   attributeValue: unknown;
 * }} NonIterableEachAttributeMessage
 */

/**
 * @typedef {Message<typeof MessageTag.InvalidExpandResult> & {
 *   actualResult: unknown;
 * }} InvalidExpandResultMessage
 */

/**
 * @typedef {Message<typeof MessageTag.MissingExportedValueFromBuild> & {
 *   names: Array<string>;
 * }} MissingExportedValueFromBuildMessage
 */

/**
 * @typedef {Message<typeof MessageTag.JsSyntaxError> & {
 *   error: SyntaxError;
 * }} JsSyntaxErrorMessage
 */

/**
 * @typedef {Message<typeof MessageTag.NotDefinedPortalName>} NotDefinedPortalNameMessage
 */

/**
 * @typedef {Message<typeof MessageTag.ReferenceToNonExistentPortal> & {
 *   name: Stringifiable;
 * }} ReferenceToNonExistentPortalMessage
 */

/**
 * @typedef {Message<typeof MessageTag.NotDefinedExportName>} NotDefinedExportNameMessage
 */

/**
 * @typedef {Message<typeof MessageTag.MissingExportedFromHtmlValueDefinition> & {
 *   name: string;
 * }} MissingExportedValueFromHtmlDefinitionMessage
 */

/**
 * @typedef {Message<typeof MessageTag.InvalidExportElementPosition>} InvalidExportElementPositionMessage
 */

/**
 * @typedef {Message<typeof MessageTag.ComponentMissingExport> & {
 *   componentUrl: string;
 *   importedVariableName: string;
 * }} ComponentMissingExportMessage
 */

/**
 * @template {MessageTag} T
 * @param {T} tag
 * @returns {(values: Omit<Extract<AnyMessage, Message<T>>, "tag">) => Extract<AnyMessage, Message<T>>}
 */
function createMessageCreator(tag) {
  return (values) =>
    /** @type {Extract<AnyMessage, Message<T>>} */ ({ tag, ...values });
}

export const createSingleElseElementMessage = createMessageCreator(
  MessageTag.SingleElseElement,
);

export const createSingleElseIfElementMessage = createMessageCreator(
  MessageTag.SingleElseIfElement,
);

export const createInvalidNameOfImportedComponentMessage = createMessageCreator(
  MessageTag.InvalidNameOfImportedComponent,
);

export const createUnsupportedBuildScriptReexportingMessage =
  createMessageCreator(MessageTag.UnsupportedBuildScriptReexporting);

export const createFailedBuildScriptExecutionMessage = createMessageCreator(
  MessageTag.FailedBuildScriptExecution,
);

export const createEmptyExplicitComponentAliasMessage = createMessageCreator(
  MessageTag.EmptyExplicitComponentAlias,
);

export const createProhibitedReservedComponentRemappingMessage =
  createMessageCreator(MessageTag.ProhibitedReservedComponentRemapping);

export const createInvalidImportComponentPositionMessage = createMessageCreator(
  MessageTag.InvalidImportComponentPosition,
);

export const createFailedInHtmlExpressionExecutionMessage =
  createMessageCreator(MessageTag.FailedInHtmlExpressionExecution);

export const createInvalidExpandResultMessage = createMessageCreator(
  MessageTag.InvalidExpandResult,
);

export const createNonIterableEachAttributeMessage = createMessageCreator(
  MessageTag.NonIterableEachAttribute,
);

export const createMissingExportedValueFromBuildMessage = createMessageCreator(
  MessageTag.MissingExportedValueFromBuild,
);

export const createJsSyntaxErrorMessage = createMessageCreator(
  MessageTag.JsSyntaxError,
);

export const createNotDefinedPortalNameMessage = createMessageCreator(
  MessageTag.NotDefinedPortalName,
);

export const createReferenceToNonExistendPortalMessage = createMessageCreator(
  MessageTag.ReferenceToNonExistentPortal,
);

export const createNotDefinedExportNameMessage = createMessageCreator(
  MessageTag.NotDefinedExportName,
);

export const createMissingExportedValueFromHtmlDefinitionMessage =
  createMessageCreator(MessageTag.MissingExportedFromHtmlValueDefinition);

export const createInvalidExportElementPositionMessage = createMessageCreator(
  MessageTag.InvalidExportElementPosition,
);

export const createComponentMissingExportMessage = createMessageCreator(
  MessageTag.ComponentMissingExport,
);
