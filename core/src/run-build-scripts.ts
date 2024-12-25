import { ancestor } from "acorn-walk";
import { generate } from "astring";
import { isText, type Text } from "domhandler";
import {
  type AssignmentProperty,
  type ExpressionStatement,
  type Identifier,
  type Node,
  parse,
  type Pattern,
  type RestElement,
} from "acorn";

import type { Options } from "./options.js";
import type { HtmlNodesCollection } from "./collect-html-nodes.js";
import type { VirtualFile } from "./virtual-file.js";
import { resolveUrl, createUrlCreator } from "./location.js";
import { createAsyncStatementsJsRunner } from "./js-runners.js";
import {
  getLocationOfHtmlNode,
  type HtmlBuildScriptElement,
} from "./html-nodes.js";
import {
  createFailedBuildScriptExecutionMessage,
  createInvalidChildOfExecutableScriptMessage,
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

export interface PublicNameWithAlias {
  local: string;
  exported: string;
}

export async function runBuildScripts(
  collection: HtmlNodesCollection,
  localThis: Record<string, unknown>,
  publicNames: Array<PublicNameWithAlias>,
  file: VirtualFile,
  options: Options,
): Promise<void> {
  const url = createUrlCreator(file);

  for (const buildScriptElement of collection.buildScripts) {
    const maybeText = buildScriptElement.firstChild;

    if (maybeText && !isText(maybeText)) {
      options.diagnostics.publish(
        createInvalidChildOfExecutableScriptMessage({
          sourceFile: file,
          location: getLocationOfHtmlNode(maybeText),
        }),
      );
    } else if (maybeText) {
      const code = compileAndCollectExportedVariables(
        buildScriptElement,
        maybeText,
        publicNames,
        file,
        options,
      );

      const runBuildScript = createAsyncStatementsJsRunner(
        code,
        Object.keys(localThis),
      );

      try {
        await runBuildScript(
          options.properties,
          localThis,
          options.buildStore,
          url,
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
      }
    } else {
      // No text, nothing to execute.
    }
  }

  // Avoid reexecuting them when the compiler starts
  // analysing a first inner scope.
  collection.buildScripts.length = 0;
}

function compileAndCollectExportedVariables(
  buildScriptElement: HtmlBuildScriptElement,
  text: Text,
  publicNames: Array<PublicNameWithAlias>,
  file: VirtualFile,
  options: Options,
): string {
  const executableAst = parse(text.data, {
    sourceType:
      buildScriptElement.attribs.type === "module" ? "module" : "script",
    ecmaVersion: "latest",
  });

  ancestor(executableAst, {
    ImportDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent)) {
        const index = parent.body.findIndex((child) => child === node);
        const source =
          typeof node.source.value === "string"
            ? createJsLiteralAstNode({
                value: resolveUrl(file, node.source.value),
              })
            : node.source;

        parent.body[index] = createJsVariableDeclarationAstNode({
          kind: "const",
          declarations: [
            createJsVariableDeclaratorAstNode({
              id: createJsObjectPatternAstNode({
                properties: node.specifiers.map(
                  (specifier): AssignmentProperty | RestElement => {
                    // Make imported value visible to in-html expressions.
                    parent.body.push(
                      createAssignmentToLocalThisOf(specifier.local),
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
                  },
                ),
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
              value: resolveUrl(file, node.source.value),
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
          const property = key as keyof Node;
          const value: unknown = parent[property];

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
              parent.body.push(createAssignmentToLocalThisOf(identifier));
            },
          );
        });
      }
    },
    FunctionDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent) && node.id) {
        parent.body.push(createAssignmentToLocalThisOf(node.id));
      }
    },
    ClassDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent) && node.id) {
        parent.body.push(createAssignmentToLocalThisOf(node.id));
      }
    },
    ExportNamedDeclaration(node, _, ancestors) {
      const parent = ancestors.at(-2);

      if (parent && isJsProgram(parent)) {
        if (node.source) {
          options.diagnostics.publish(
            createUnsupportedBuildScriptReexportingMessage({
              sourceFile: file,
              location: getLocationOfHtmlNode(buildScriptElement),
              reexportLocation: getLocationOfJsNode(node),
            }),
          );
        } else {
          const index = parent.body.findIndex((child) => child === node);

          if (node.declaration) {
            switch (node.declaration.type) {
              case "ClassDeclaration":
              case "FunctionDeclaration":
                publicNames.push({
                  local: node.declaration.id.name,
                  exported: node.declaration.id.name,
                });
                parent.body.push(
                  createAssignmentToLocalThisOf(node.declaration.id),
                );
                break;
              case "VariableDeclaration":
                node.declaration.declarations.forEach((declarator) =>
                  recursivelyDescendAndFindLocalVariables(
                    declarator.id,
                    (identifier) => {
                      publicNames.push({
                        local: identifier.name,
                        exported: identifier.name,
                      });
                      parent.body.push(
                        createAssignmentToLocalThisOf(identifier),
                      );
                    },
                  ),
                );
                break;
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
                    : (specifier.exported.value as string),
                });
                parent.body.push(
                  createAssignmentToLocalThisOf(specifier.local),
                );
              }
            });

            // We want to avoid changes in nodes quantity.
            // Adding an empty statement is a safe method to preserve nodes count.
            parent.body[index] = createJsEmptyStatementAstNode();
          }
        }
      }
    },
    ExportAllDeclaration(node) {
      options.diagnostics.publish(
        createUnsupportedBuildScriptReexportingMessage({
          sourceFile: file,
          location: getLocationOfHtmlNode(buildScriptElement),
          reexportLocation: getLocationOfJsNode(node),
        }),
      );
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
          parent.body.push(createAssignmentToLocalThisOf(node.declaration.id));
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

function recursivelyDescendAndFindLocalVariables(
  pattern: Pattern,
  onLeafIdentifier: (node: Identifier) => void,
): void {
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

function createAssignmentToLocalThisOf(
  identifierNode: Identifier,
): ExpressionStatement {
  return createJsExpressionStatementAstNode({
    expression: createJsAssignmentExpressionAstNode({
      operator: "=",
      left: createJsMemberExpressionAstNode({
        computed: false,
        optional: false,
        object: createJsIdentifierAstNode({
          name: "localThis",
        }),
        property: identifierNode,
      }),
      right: identifierNode,
    }),
  });
}
