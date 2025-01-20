/**
 * @import {
 *   AnonymousClassDeclaration,
 *   AnonymousFunctionDeclaration,
 *   AnyNode,
 *   ArrayPattern,
 *   AssignmentExpression,
 *   AssignmentProperty,
 *   AwaitExpression,
 *   CallExpression,
 *   ClassDeclaration,
 *   ClassExpression,
 *   EmptyStatement,
 *   Expression,
 *   ExpressionStatement,
 *   FunctionDeclaration,
 *   FunctionExpression,
 *   Identifier,
 *   Literal,
 *   MemberExpression,
 *   Node,
 *   ObjectExpression,
 *   ObjectPattern,
 *   Program,
 *   Property,
 *   RestElement,
 *   VariableDeclaration,
 *   VariableDeclarator,
 * } from "acorn";
 */

/** @import { Location } from "./diagnostics.js"; */

/**
 * @param {AnyNode} node
 * @returns {Location}
 */
export function getLocationOfJsNode(node) {
  return { start: node.start, end: node.end };
}

/**
 * @param {Node} node
 * @returns {node is Identifier}
 */
export function isJsIdentifier(node) {
  return node.type === "Identifier";
}

/**
 * @param {Node} node
 * @returns {node is ObjectPattern}
 */
export function isJsObjectPattern(node) {
  return node.type === "ObjectPattern";
}

/**
 * @param {Node} node
 * @returns {node is ArrayPattern}
 */
export function isJsArrayPattern(node) {
  return node.type === "ArrayPattern";
}

/**
 * @param {Node} node
 * @returns {node is AssignmentProperty}
 */
export function isJsAssignmentProperty(node) {
  return node.type === "AssignmentProperty";
}

/**
 * @param {Node} node
 * @returns {node is FunctionDeclaration}
 */
export function isJsFunctionDeclaration(node) {
  return node.type === "FunctionDeclaration";
}

/**
 * @param {Node} node
 * @returns {node is ClassDeclaration}
 */
export function isJsClassDeclaration(node) {
  return node.type === "ClassDeclaration";
}

/**
 * @param {Node} node
 * @returns {node is VariableDeclaration}
 */
export function isJsVariableDeclaration(node) {
  return node.type === "VariableDeclaration";
}

/**
 * @param {Node} node
 * @returns {node is Program}
 */
export function isJsProgram(node) {
  return node.type === "Program";
}

/**
 * @param {Node} node
 * @returns {node is RestElement}
 */
export function isJsRestElement(node) {
  return node.type === "RestElement";
}

/**
 * @param {Node} node
 * @returns {node is Expression}
 */
export function isJsExpression(node) {
  return node.type === "Expression";
}

/**
 * @param {Node} node
 * @returns {node is AnonymousClassDeclaration}
 */
export function isJsAnonymousClassDeclaration(node) {
  return node.type === "AnonymousClassDeclaration";
}

/**
 * @param {Node} node
 * @returns {node is AnonymousFunctionDeclaration}
 */
export function isJsAnonymousFunctionDeclaration(node) {
  return node.type === "AnonymousFunctionDeclaration";
}

/**
 * @template {AnyNode} A
 * @typedef {Omit<A, "type" | "start" | "end">} AstNodeWithoutLocationAndType
 */

/**
 * @template {AnyNode} E
 * @param {Omit<E, 'start' | 'end'>} values
 * @returns {E}
 */
function createJsAstNode(values) {
  return /** @type {E} */ ({ start: 0, end: 0, ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<Identifier>} values
 * @returns {Identifier}
 */
export function createJsIdentifierAstNode(values) {
  return createJsAstNode({ type: "Identifier", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<Property>} values
 * @returns {Property}
 */
export function createJsPropertyAstNode(values) {
  return createJsAstNode({ type: "Property", ...values });
}

/**
 * @param {Omit<AstNodeWithoutLocationAndType<AssignmentProperty>, "kind">} values
 * @returns {AssignmentProperty}
 */
export function createJsAssignmentPropertyAstNode(values) {
  return createJsAstNode({
    type: "Property",
    kind: "init",
    ...values,
  });
}

/**
 * @param {AstNodeWithoutLocationAndType<CallExpression>} values
 * @returns {CallExpression}
 */
export function createJsCallExpressionAstNode(values) {
  return createJsAstNode({ type: "CallExpression", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<AwaitExpression>} values
 * @returns {AwaitExpression}
 */
export function createJsAwaitExpressionAstNode(values) {
  return createJsAstNode({ type: "AwaitExpression", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<VariableDeclarator>} values
 * @returns {VariableDeclarator}
 */
export function createJsVariableDeclaratorAstNode(values) {
  return createJsAstNode({ type: "VariableDeclarator", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<VariableDeclaration>} values
 * @returns {VariableDeclaration}
 */
export function createJsVariableDeclarationAstNode(values) {
  return createJsAstNode({ type: "VariableDeclaration", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<RestElement>} values
 * @returns {RestElement}
 */
export function createJsRestElementAstNode(values) {
  return createJsAstNode({ type: "RestElement", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<ObjectPattern>} values
 * @returns {ObjectPattern}
 */
export function createJsObjectPatternAstNode(values) {
  return createJsAstNode({ type: "ObjectPattern", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<ExpressionStatement>} values
 * @returns {ExpressionStatement}
 */
export function createJsExpressionStatementAstNode(values) {
  return createJsAstNode({ type: "ExpressionStatement", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<AssignmentExpression>} values
 * @returns {AssignmentExpression}
 */
export function createJsAssignmentExpressionAstNode(values) {
  return createJsAstNode({ type: "AssignmentExpression", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<MemberExpression>} values
 * @returns {MemberExpression}
 */
export function createJsMemberExpressionAstNode(values) {
  return createJsAstNode({ type: "MemberExpression", ...values });
}

/**
 * @returns {EmptyStatement}
 */
export function createJsEmptyStatementAstNode() {
  return createJsAstNode({ type: "EmptyStatement" });
}

/**
 * @param {AstNodeWithoutLocationAndType<FunctionExpression>} values
 * @returns {FunctionExpression}
 */
export function createJsFunctionExpressionAstNode(values) {
  return createJsAstNode({ type: "FunctionExpression", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<ClassExpression>} values
 * @returns {ClassExpression}
 */
export function createJsClassExpressionAstNode(values) {
  return createJsAstNode({ type: "ClassExpression", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<ObjectExpression>} values
 * @returns {ObjectExpression}
 */
export function createJsObjectExpressionAstNode(values) {
  return createJsAstNode({ type: "ObjectExpression", ...values });
}

/**
 * @param {AstNodeWithoutLocationAndType<Literal>} values
 * @returns {Literal}
 */
export function createJsLiteralAstNode(values) {
  return createJsAstNode({ type: "Literal", ...values });
}
