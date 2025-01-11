import type {
  AnonymousClassDeclaration,
  AnonymousFunctionDeclaration,
  AnyNode,
  ArrayPattern,
  AssignmentExpression,
  AssignmentProperty,
  AwaitExpression,
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  EmptyStatement,
  Expression,
  ExpressionStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  Literal,
  MemberExpression,
  Node,
  ObjectExpression,
  ObjectPattern,
  Program,
  Property,
  RestElement,
  VariableDeclaration,
  VariableDeclarator,
} from "acorn";

import type { Location } from "./diagnostics.js";

export function getLocationOfJsNode(node: AnyNode): Location {
  return { start: node.start, end: node.end };
}

function createJsNodePredicate<T extends Node>(type: string) {
  return (node: Node): node is T => node.type === type;
}

export const isJsIdentifier = createJsNodePredicate<Identifier>("Identifier");

export const isJsObjectPattern =
  createJsNodePredicate<ObjectPattern>("ObjectPattern");

export const isJsArrayPattern =
  createJsNodePredicate<ArrayPattern>("ArrayPattern");

export const isJsAssignmentProperty =
  createJsNodePredicate<AssignmentProperty>("AssignmentProperty");

export const isJsFunctionDeclaration =
  createJsNodePredicate<FunctionDeclaration>("FunctionDeclaration");

export const isJsClassDeclaration =
  createJsNodePredicate<ClassDeclaration>("ClassDeclaration");

export const isJsVariableDeclaration =
  createJsNodePredicate<VariableDeclaration>("VariableDeclaration");

export const isJsProgram = createJsNodePredicate<Program>("Program");

export const isJsRestElement =
  createJsNodePredicate<RestElement>("RestElement");

export const isJsExpression = createJsNodePredicate<Expression>("Expression");

export const isJsAnonymousClassDeclaration =
  createJsNodePredicate<AnonymousClassDeclaration>("AnonymousClassDeclaration");

export const isJsAnonymousFunctionDeclaration =
  createJsNodePredicate<AnonymousFunctionDeclaration>(
    "AnonymousFunctionDeclaration",
  );

export type AstNodeWithoutLocationAndType<A extends AnyNode> = Omit<
  A,
  "type" | "start" | "end"
>;

function createJsAstNode<E extends AnyNode>(
  values: Omit<E, "start" | "end">,
): E {
  return { start: 0, end: 0, ...values } as E;
}

export function createJsIdentifierAstNode(
  values: AstNodeWithoutLocationAndType<Identifier>,
): Identifier {
  return createJsAstNode({ type: "Identifier", ...values });
}

export function createJsPropertyAstNode(
  values: AstNodeWithoutLocationAndType<Property>,
): Property {
  return createJsAstNode({ type: "Property", ...values });
}

export function createJsAssignmentPropertyAstNode(
  values: Omit<AstNodeWithoutLocationAndType<AssignmentProperty>, "kind">,
): AssignmentProperty {
  return createJsAstNode({
    type: "Property",
    // That's the lone value of this property, so we can predefine it here.
    kind: "init",
    ...values,
  });
}

export function createJsCallExpressionAstNode(
  values: AstNodeWithoutLocationAndType<CallExpression>,
): CallExpression {
  return createJsAstNode({ type: "CallExpression", ...values });
}

export function createJsAwaitExpressionAstNode(
  values: AstNodeWithoutLocationAndType<AwaitExpression>,
): AwaitExpression {
  return createJsAstNode({ type: "AwaitExpression", ...values });
}

export function createJsVariableDeclaratorAstNode(
  values: AstNodeWithoutLocationAndType<VariableDeclarator>,
): VariableDeclarator {
  return createJsAstNode({ type: "VariableDeclarator", ...values });
}

export function createJsVariableDeclarationAstNode(
  values: AstNodeWithoutLocationAndType<VariableDeclaration>,
): VariableDeclaration {
  return createJsAstNode({ type: "VariableDeclaration", ...values });
}

export function createJsRestElementAstNode(
  values: AstNodeWithoutLocationAndType<RestElement>,
): RestElement {
  return createJsAstNode({ type: "RestElement", ...values });
}

export function createJsObjectPatternAstNode(
  values: AstNodeWithoutLocationAndType<ObjectPattern>,
): ObjectPattern {
  return createJsAstNode({ type: "ObjectPattern", ...values });
}

export function createJsExpressionStatementAstNode(
  values: AstNodeWithoutLocationAndType<ExpressionStatement>,
): ExpressionStatement {
  return createJsAstNode({ type: "ExpressionStatement", ...values });
}

export function createJsAssignmentExpressionAstNode(
  values: AstNodeWithoutLocationAndType<AssignmentExpression>,
): AssignmentExpression {
  return createJsAstNode({ type: "AssignmentExpression", ...values });
}

export function createJsMemberExpressionAstNode(
  values: AstNodeWithoutLocationAndType<MemberExpression>,
): MemberExpression {
  return createJsAstNode({ type: "MemberExpression", ...values });
}

export function createJsEmptyStatementAstNode(): EmptyStatement {
  return createJsAstNode({ type: "EmptyStatement" });
}

export function createJsFunctionExpressionAstNode(
  values: AstNodeWithoutLocationAndType<FunctionExpression>,
): FunctionExpression {
  return createJsAstNode({ type: "FunctionExpression", ...values });
}

export function createJsClassExpressionAstNode(
  values: AstNodeWithoutLocationAndType<ClassExpression>,
): ClassExpression {
  return createJsAstNode({ type: "ClassExpression", ...values });
}

export function createJsObjectExpressionAstNode(
  values: AstNodeWithoutLocationAndType<ObjectExpression>,
): ObjectExpression {
  return createJsAstNode({ type: "ObjectExpression", ...values });
}

export function createJsLiteralAstNode(
  values: AstNodeWithoutLocationAndType<Literal>,
): Literal {
  return createJsAstNode({ type: "Literal", ...values });
}
