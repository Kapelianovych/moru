/**
 * @import { Text, Element, Document } from 'domhandler';
 * @import { Node, ExpressionStatement, Identifier, Pattern, Program } from 'acorn';
 */

/**
 * @import { Options } from './options.js';
 * @import { HtmlNodesCollection } from './collect-html-nodes.js';
 * @import { VirtualFile } from './virtual-file.js';
 * @import { HtmlBuildScriptElement } from './html-nodes.js';
 * @import { LocalThis } from './local-this.js';
 * @import { LifecyclePhaseSubscriber } from './lifecycle.js';
 */

import { ancestor } from "acorn-walk";
import { generate } from "astring";
import { parse } from "acorn";

import { createEmptyHtmlNodesCollection } from "./collect-html-nodes.js";
import { createUrlCreator } from "./location.js";
import {
  collectGlobalVariablesForJsRunner,
  createAsyncStatementsJsRunner,
} from "./js-runners.js";
import { getLocationOfHtmlNode } from "./html-nodes.js";
import {
  createFailedBuildScriptExecutionMessage,
  createJsSyntaxErrorMessage,
  createUnsupportedBuildScriptReexportingMessage,
} from "./diagnostics.js";
import {
  createJsAssignmentExpressionAstNode,
  createJsAssignmentPropertyAstNode,
  createJsAwaitExpressionAstNode,
  createJsCallExpressionAstNode,
  createJsClassExpressionAstNode,
  createJsEmptyStatementAstNode,
  createJsExpressionStatementAstNode,
  createJsFunctionExpressionAstNode,
  createJsIdentifierAstNode,
  createJsLiteralAstNode,
  createJsMemberExpressionAstNode,
  createJsObjectExpressionAstNode,
  createJsObjectPatternAstNode,
  createJsPropertyAstNode,
  createJsRestElementAstNode,
  createJsVariableDeclarationAstNode,
  createJsVariableDeclaratorAstNode,
  getLocationOfJsNode,
  isJsAnonymousClassDeclaration,
  isJsAnonymousFunctionDeclaration,
  isJsClassDeclaration,
  isJsFunctionDeclaration,
  isJsIdentifier,
  isJsProgram,
  isJsRestElement,
} from "./js-nodes.js";

/**
 * @typedef {Object} PublicNameWithAlias
 * @property {string} local
 * @property {string} exported
 */

/**
 * @param {HtmlNodesCollection} collection
 * @param {LocalThis} localThis
 * @param {Array<PublicNameWithAlias>} publicNames
 * @param {Document | Element} ast
 * @param {LifecyclePhaseSubscriber} onAfterRender
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Promise<void>}
 */
export async function runBuildScripts(
  collection,
  localThis,
  publicNames,
  ast,
  onAfterRender,
  file,
  options,
) {
  const url = createUrlCreator(file, options);

  for (const buildScriptElement of collection.buildScripts) {
    const maybeText = /** @type {Text | null} */ (
      buildScriptElement.firstChild
    );

    if (maybeText) {
      const code = compileAndCollectExportedVariables(
        buildScriptElement,
        maybeText,
        publicNames,
        file,
        options,
      );

      if (code == null) {
        return discardCompiledScope(collection, ast);
      }

      const runBuildScript = createAsyncStatementsJsRunner(
        code,
        collectGlobalVariablesForJsRunner(localThis),
      );

      try {
        await runBuildScript(
          options.properties,
          localThis,
          options.buildStore,
          url,
          onAfterRender,
          options.dynamicallyImportJsFile,
        );
      } catch (error) {
        options.diagnostics.publish(
          createFailedBuildScriptExecutionMessage({
            error,
            sourceFile: file,
            location: getLocationOfHtmlNode(buildScriptElement),
          }),
        );
        return discardCompiledScope(collection, ast);
      }
    } else {
      // No text, nothing to execute.
    }
  }

  // Avoid reexecuting them when the compiler starts
  // analysing a first inner scope.
  collection.buildScripts.length = 0;
}

/**
 * @param {HtmlBuildScriptElement} buildScriptElement
 * @param {Text} text
 * @param {Array<PublicNameWithAlias>} publicNames
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {string | void}
 */
function compileAndCollectExportedVariables(
  buildScriptElement,
  text,
  publicNames,
  file,
  options,
) {
  const sourceType =
    buildScriptElement.attribs.type === "module" ? "module" : "script";
  /** @type {Program} */
  let executableAst;

  try {
    executableAst = parse(text.data, {
      sourceType,
      ecmaVersion: "latest",
    });
  } catch (error) {
    options.diagnostics.publish(
      createJsSyntaxErrorMessage({
        // @ts-expect-error the "error" variable is not "SyntaxError" explicitly because of TypeScript
        // rules, but here might be no other error except the syntax error.
        error,
        location: getLocationOfHtmlNode(buildScriptElement),
        sourceFile: file,
      }),
    );
    // Signal that the whole scope has to be discarded.
    return;
  }

  ancestor(executableAst, {
    ImportDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent)) {
        const index = parent.body.findIndex((child) => child === node);
        const source =
          typeof node.source.value === "string"
            ? createJsLiteralAstNode({
                value: options.resolveUrl(file, node.source.value),
              })
            : node.source;

        parent.body[index] = createJsVariableDeclarationAstNode({
          kind: "const",
          declarations: [
            createJsVariableDeclaratorAstNode({
              id: createJsObjectPatternAstNode({
                properties: node.specifiers.map((specifier) => {
                  // Make imported value visible to in-html expressions.
                  parent.body.push(
                    createAssignmentToLocalThisOf(specifier.local, true),
                  );

                  switch (specifier.type) {
                    case "ImportDefaultSpecifier":
                      return createJsAssignmentPropertyAstNode({
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: createJsIdentifierAstNode({
                          name: "default",
                        }),
                        value: specifier.local,
                      });
                    case "ImportNamespaceSpecifier":
                      return createJsRestElementAstNode({
                        argument: specifier.local,
                      });
                    case "ImportSpecifier":
                      return createJsAssignmentPropertyAstNode({
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: specifier.imported,
                        value: specifier.local,
                      });
                  }
                }),
              }),
              init: createJsAwaitExpressionAstNode({
                argument: createJsCallExpressionAstNode({
                  optional: false,
                  callee: createJsIdentifierAstNode({
                    name: "dynamicallyImportJsFile",
                  }),
                  arguments: [source],
                }),
              }),
            }),
          ],
        });
      }
    },
    ImportExpression(node, _, ancestors) {
      const parent = ancestors.at(-2);

      const source =
        node.source.type === "Literal" && typeof node.source.value === "string"
          ? createJsLiteralAstNode({
              value: options.resolveUrl(file, node.source.value),
            })
          : node.source;

      if (parent) {
        const replacementNode = createJsAwaitExpressionAstNode({
          argument: createJsCallExpressionAstNode({
            optional: false,
            callee: createJsIdentifierAstNode({
              name: "dynamicallyImportJsFile",
            }),
            arguments: [
              source,
              node.options ??
                createJsObjectExpressionAstNode({ properties: [] }),
            ],
          }),
        });

        for (const key in parent) {
          const property = /** @type {keyof Node} */ (key);
          /** @type {unknown} */
          const value = parent[property];

          if (value === node) {
            // @ts-expect-error Since we don't know concrete type of Node
            // here, TS cannot found any property in parent which can hold
            // AwaitExpression.
            parent[property] = replacementNode;
            break;
          } else if (Array.isArray(value)) {
            const index = value.findIndex((child) => child === node);

            value[index] = replacementNode;
            break;
          }
        }
      }
    },
    VariableDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent)) {
        node.declarations.forEach((declarator) => {
          recursivelyDescendAndFindLocalVariables(
            declarator.id,
            (identifier) => {
              parent.body.push(
                createAssignmentToLocalThisOf(
                  identifier,
                  node.kind === "const",
                ),
              );
            },
          );
        });
      }
    },
    FunctionDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent) && node.id) {
        parent.body.push(createAssignmentToLocalThisOf(node.id, false));
      }
    },
    ClassDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent) && node.id) {
        parent.body.push(createAssignmentToLocalThisOf(node.id, false));
      }
    },
    ExportNamedDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent)) {
        const index = parent.body.findIndex((child) => child === node);

        if (node.source) {
          options.diagnostics.publish(
            createUnsupportedBuildScriptReexportingMessage({
              sourceFile: file,
              location: getLocationOfHtmlNode(buildScriptElement),
              reexportLocation: getLocationOfJsNode(node),
            }),
          );
          parent.body[index] = createJsEmptyStatementAstNode();
        } else {
          if (node.declaration) {
            switch (node.declaration.type) {
              case "ClassDeclaration":
              case "FunctionDeclaration":
                publicNames.push({
                  local: node.declaration.id.name,
                  exported: node.declaration.id.name,
                });
                parent.body.push(
                  createAssignmentToLocalThisOf(node.declaration.id, false),
                );
                break;
              case "VariableDeclaration": {
                const declaration = node.declaration;

                declaration.declarations.forEach((declarator) =>
                  recursivelyDescendAndFindLocalVariables(
                    declarator.id,
                    (identifier) => {
                      publicNames.push({
                        local: identifier.name,
                        exported: identifier.name,
                      });
                      parent.body.push(
                        createAssignmentToLocalThisOf(
                          identifier,
                          declaration.kind === "const",
                        ),
                      );
                    },
                  ),
                );
                break;
              }
            }

            parent.body[index] = node.declaration;
          } else {
            node.specifiers.forEach((specifier) => {
              if (
                isJsIdentifier(specifier.local) &&
                (isJsIdentifier(specifier.exported) ||
                  typeof specifier.exported.value === "string")
              ) {
                publicNames.push({
                  local: specifier.local.name,
                  exported: isJsIdentifier(specifier.exported)
                    ? specifier.exported.name
                    : /** @type {string} */ (specifier.exported.value),
                });
              }
            });

            // We want to avoid changes in nodes quantity.
            // Adding an empty statement is a safe method to preserve nodes count.
            parent.body[index] = createJsEmptyStatementAstNode();
          }
        }
      }
    },
    ExportAllDeclaration(node, _, ancestors) {
      options.diagnostics.publish(
        createUnsupportedBuildScriptReexportingMessage({
          sourceFile: file,
          location: getLocationOfHtmlNode(buildScriptElement),
          reexportLocation: getLocationOfJsNode(node),
        }),
      );

      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent)) {
        const index = parent.body.findIndex((child) => child === node);

        parent.body[index] = createJsEmptyStatementAstNode();
      }
    },
    ExportDefaultDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent)) {
        const index = parent.body.findIndex((child) => child === node);

        if (
          isJsFunctionDeclaration(node.declaration) ||
          isJsClassDeclaration(node.declaration)
        ) {
          parent.body[index] = node.declaration;
          // Functions and classes are defined as declarations, so they will be
          // accessible in the module.
          parent.body.push(
            createAssignmentToLocalThisOf(node.declaration.id, false),
          );
          publicNames.push({
            local: node.declaration.id.name,
            exported: "default",
          });
        } else {
          parent.body[index] = createJsExpressionStatementAstNode({
            expression: createJsAssignmentExpressionAstNode({
              operator: "=",
              left: createJsMemberExpressionAstNode({
                computed: false,
                optional: false,
                object: createJsIdentifierAstNode({
                  name: "localThis",
                }),
                property: createJsIdentifierAstNode({ name: "default" }),
              }),
              right: isJsAnonymousClassDeclaration(node.declaration)
                ? createJsClassExpressionAstNode({
                    id: node.declaration.id,
                    body: node.declaration.body,
                    superClass: node.declaration.superClass,
                  })
                : isJsAnonymousFunctionDeclaration(node.declaration)
                  ? createJsFunctionExpressionAstNode({
                      id: node.declaration.id,
                      async: node.declaration.async,
                      params: node.declaration.params,
                      body: node.declaration.body,
                      generator: node.declaration.generator,
                      expression: node.declaration.expression,
                    })
                  : node.declaration,
            }),
          });

          publicNames.push({ local: "default", exported: "default" });
        }
      }
    },
  });

  return generate(executableAst);
}

/**
 * @param {Pattern} pattern
 * @param {(node: Identifier) => void} onLeafIdentifier
 * @returns {void}
 */
function recursivelyDescendAndFindLocalVariables(pattern, onLeafIdentifier) {
  switch (pattern.type) {
    case "RestElement":
      recursivelyDescendAndFindLocalVariables(
        pattern.argument,
        onLeafIdentifier,
      );
      break;
    case "Identifier":
      onLeafIdentifier(pattern);
      break;
    case "ArrayPattern":
      pattern.elements.forEach((pattern) => {
        if (pattern) {
          recursivelyDescendAndFindLocalVariables(pattern, onLeafIdentifier);
        }
      });
      break;
    case "ObjectPattern":
      pattern.properties.forEach((property) => {
        if (isJsRestElement(property)) {
          recursivelyDescendAndFindLocalVariables(property, onLeafIdentifier);
        } else {
          recursivelyDescendAndFindLocalVariables(
            property.value,
            onLeafIdentifier,
          );
        }
      });
      break;
    case "AssignmentPattern":
      recursivelyDescendAndFindLocalVariables(pattern.left, onLeafIdentifier);
      break;
  }
}

/**
 * @param {Identifier} identifierNode
 * @param {boolean} isConstant
 * @returns {ExpressionStatement}
 */
function createAssignmentToLocalThisOf(identifierNode, isConstant) {
  return createJsExpressionStatementAstNode({
    expression: createJsCallExpressionAstNode({
      optional: false,
      callee: createJsMemberExpressionAstNode({
        optional: false,
        computed: false,
        object: createJsIdentifierAstNode({ name: "Reflect" }),
        property: createJsIdentifierAstNode({ name: "defineProperty" }),
      }),
      arguments: [
        createJsIdentifierAstNode({ name: "localThis" }),
        createJsLiteralAstNode({ value: identifierNode.name }),
        createJsObjectExpressionAstNode({
          properties: [
            createJsPropertyAstNode({
              method: false,
              computed: false,
              shorthand: false,
              kind: "init",
              key: createJsIdentifierAstNode({ name: "value" }),
              value: identifierNode,
            }),
            createJsPropertyAstNode({
              method: false,
              computed: false,
              shorthand: false,
              kind: "init",
              key: createJsIdentifierAstNode({ name: "writable" }),
              value: createJsLiteralAstNode({ value: !isConstant }),
            }),
            createJsPropertyAstNode({
              method: false,
              computed: false,
              shorthand: false,
              kind: "init",
              key: createJsIdentifierAstNode({ name: "configurable" }),
              value: createJsLiteralAstNode({ value: true }),
            }),
            createJsPropertyAstNode({
              method: false,
              computed: false,
              shorthand: false,
              kind: "init",
              key: createJsIdentifierAstNode({ name: "enumerable" }),
              value: createJsLiteralAstNode({ value: true }),
            }),
          ],
        }),
      ],
    }),
  });
}

/**
 * @param {HtmlNodesCollection} collection
 * @param {Document | Element} ast
 * @returns {void}
 */
function discardCompiledScope(collection, ast) {
  ast.children = [];

  if ("attribs" in ast) {
    ast.attribs = {};
  }

  Object.assign(collection, createEmptyHtmlNodesCollection());
}
