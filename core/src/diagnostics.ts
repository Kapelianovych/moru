import type { VirtualFile } from "./virtual-file.js";

export enum MessageTag {
  SingleElseElement,
  SingleElseIfElement,
  InvalidFileName,
  ExternalBuildScript,
  InvalidChildOfExecutableScript,
  UnsupportedBuildScriptReexporting,
  FailedBuildScriptExecution,
  ProhibitedReservedComponentRemapping,
  EmptyExplicitComponentAlias,
  InvalidImportComponentPosition,
  FailedInHtmlExpressionExecution,
  InvalidExpandResult,
  NonIterableEachAttribute,
  InvalidChildOfStyleElement,
  MissingExportedValueFromBuild,
}

export interface Location {
  start: number;
  end: number;
}

export interface Message<T extends MessageTag> {
  tag: T;
  location: Location;
  sourceFile: VirtualFile;
}

export interface Diagnostics {
  publish(message: AnyMessage): void;
}

export type AnyMessage =
  | SingleElseElementMessage
  | SingleElseIfElementMessage
  | InvalidFileNameMessage
  | ExternalBuildScriptMessage
  | InvalidChildOfExecutableScriptMessage
  | UnsupportedBuildScriptReexportingMessage
  | FailedBuildScriptExecutionMessage
  | EmptyExplicitComponentAliasMessage
  | InvalidImportComponentPositionMessage
  | FailedInHtmlExpressionExecutionMessage
  | InvalidExpandResultMessage
  | NonIterableEachAttributeMessage
  | InvalidChildOfStyleElementMessage
  | MissingExportedValueFromBuildMessage
  | ProhibitedReservedComponentRemappingMessage;

export interface SingleElseElementMessage
  extends Message<MessageTag.SingleElseElement> {}

export interface SingleElseIfElementMessage
  extends Message<MessageTag.SingleElseIfElement> {}

export interface InvalidFileNameMessage
  extends Message<MessageTag.InvalidFileName> {
  url: string;
  extension: string;
}

export interface ExternalBuildScriptMessage
  extends Message<MessageTag.ExternalBuildScript> {
  path: string;
}

export interface InvalidChildOfExecutableScriptMessage
  extends Message<MessageTag.InvalidChildOfExecutableScript> {}

export interface UnsupportedBuildScriptReexportingMessage
  extends Message<MessageTag.UnsupportedBuildScriptReexporting> {
  reexportLocation: Location;
}

export interface FailedBuildScriptExecutionMessage
  extends Message<MessageTag.FailedBuildScriptExecution> {
  error: unknown;
}

export interface ProhibitedReservedComponentRemappingMessage
  extends Message<MessageTag.ProhibitedReservedComponentRemapping> {}

export interface EmptyExplicitComponentAliasMessage
  extends Message<MessageTag.EmptyExplicitComponentAlias> {}

export interface InvalidImportComponentPositionMessage
  extends Message<MessageTag.InvalidImportComponentPosition> {}

export interface FailedInHtmlExpressionExecutionMessage
  extends Message<MessageTag.FailedInHtmlExpressionExecution> {
  error: unknown;
}

export interface NonIterableEachAttributeMessage
  extends Message<MessageTag.NonIterableEachAttribute> {
  attributeValue: unknown;
}

export interface InvalidExpandResultMessage
  extends Message<MessageTag.InvalidExpandResult> {
  actualResult: unknown;
}

export interface InvalidChildOfStyleElementMessage
  extends Message<MessageTag.InvalidChildOfStyleElement> {}

export interface MissingExportedValueFromBuildMessage
  extends Message<MessageTag.MissingExportedValueFromBuild> {
  names: Array<string>;
}

function createMessageCreator<T extends MessageTag>(tag: T) {
  return (
    values: Omit<Extract<AnyMessage, Message<T>>, "tag">,
  ): Extract<AnyMessage, Message<T>> =>
    ({ tag, ...values }) as Extract<AnyMessage, Message<T>>;
}

export const createSingleElseElementMessage = createMessageCreator(
  MessageTag.SingleElseElement,
);

export const createSingleElseIfElementMessage = createMessageCreator(
  MessageTag.SingleElseIfElement,
);

export const createInvalidFileNameMessage = createMessageCreator(
  MessageTag.InvalidFileName,
);

export const createExternalBuildScriptMessage = createMessageCreator(
  MessageTag.ExternalBuildScript,
);

export const createInvalidChildOfExecutableScriptMessage = createMessageCreator(
  MessageTag.InvalidChildOfExecutableScript,
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

export const createInvalidChildOfStyleElementMessage = createMessageCreator(
  MessageTag.InvalidChildOfStyleElement,
);

export const createMissingExportedValueFromBuildMessage = createMessageCreator(
  MessageTag.MissingExportedValueFromBuild,
);
