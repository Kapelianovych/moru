import { getParent, removeElement } from "domutils";
import {
  type Document,
  type Element,
  isDocument,
  isTag,
  isText,
  type Text,
} from "domhandler";

import type { Options } from "./options.js";
import type { VirtualFile } from "./virtual-file.js";
import { getFileNameFrom } from "./location.js";
import { hasAnyInHtmlExpression } from "./in-html-expressions.js";
import { isHtmlElementRebaseable } from "./url-rebaser.js";
import { type HtmlVisitor, traverseHtml } from "./traverse-html.js";
import {
  createEmptyExplicitComponentAliasMessage,
  createExternalBuildScriptMessage,
  createInvalidExportElementPositionMessage,
  createInvalidFileNameMessage,
  createInvalidImportComponentPositionMessage,
  createNotDefinedExportNameMessage,
  createNotDefinedPortalNameMessage,
  createProhibitedReservedComponentRemappingMessage,
  createSingleElseElementMessage,
  createSingleElseIfElementMessage,
} from "./diagnostics.js";
import {
  getLocationOfHtmlNode,
  type HtmlBuildScriptElement,
  type HtmlClientScriptElement,
  type HtmlElseElement,
  type HtmlElseIfElement,
  HtmlExportElement,
  type HtmlForElement,
  type HtmlFragmentElement,
  type HtmlIfElement,
  type HtmlImportElement,
  type HtmlPortalElement,
  type HtmlRawElement,
  type HtmlSlotElement,
  type HtmlTransferrableElement,
  isHtmlBuildScriptElement,
  isHtmlClientScriptElement,
  isHtmlElseElement,
  isHtmlElseIfElement,
  isHtmlExportElement,
  isHtmlForElement,
  isHtmlFragmentElement,
  isHtmlIfElement,
  isHtmlImportElement,
  isHtmlPortalElement,
  isHtmlRawElement,
  isHtmlSlotElement,
  isHtmlStyleElement,
  isHtmlTransferrableElement,
} from "./html-nodes.js";

const RESERVED_HTML_ELEMENT_TAGS: Array<string> = [
  "if",
  "else",
  "else-if",
  "for",
  "raw",
  "import",
  "export",
  "script",
  "portal",
  "fragment",
  "style",
  "slot",
];

export interface ComponentDefinition {
  url: string;
  node: Element;
  /** Variables which are exprected to be exported from
   * a component to be used in passed children. */
  exports: Record<string, string>;
  hasAssignDefinitions: boolean;
}

export interface HtmlNodesCollection {
  imports: Record<string, string>;
  exports: Record<string, Element>;
  /** Locally defined reusable fragments of markup. */
  markupDefinitions: Record<string, HtmlFragmentElement>;
  getParentMarkupDefinitionFor?(name: string): HtmlFragmentElement | undefined;

  raws: Array<HtmlRawElement>;
  loops: Array<[HtmlForElement, HtmlElseElement?]>;
  slots: Array<HtmlSlotElement>;
  /** Texts with at least one expression. */
  texts: Array<Text>;
  styles: Array<Element>;
  portals: Record<string, HtmlPortalElement>;
  /** Elements with an expression in at least one attribute. */
  elements: Array<Element>;
  fragments: Array<HtmlFragmentElement>;
  components: Array<ComponentDefinition>;
  conditionals: Array<
    [HtmlIfElement, Array<HtmlElseIfElement>?, HtmlElseElement?]
  >;
  buildScripts: Array<HtmlBuildScriptElement>;
  clientScripts: Array<HtmlClientScriptElement>;
  /** Elements with attributes which may contain URL. */
  rebaseableElements: Array<Element>;
  transferrableElements: Array<HtmlTransferrableElement>;
  reusableMarkupReferences: Array<Element>;
}

export function createEmptyHtmlNodesCollection(): HtmlNodesCollection {
  return {
    imports: {},
    exports: {},
    markupDefinitions: {},

    raws: [],
    loops: [],
    slots: [],
    texts: [],
    styles: [],
    portals: {},
    elements: [],
    fragments: [],
    components: [],
    conditionals: [],
    buildScripts: [],
    clientScripts: [],
    rebaseableElements: [],
    transferrableElements: [],
    reusableMarkupReferences: [],
  };
}

/**
 * Groups nodes in one scope.
 * `<if>` and `<for>` elements create an inner scope which is not processed
 * along with a parent scope.
 */
export function collectHtmlNodes(
  parent: Document | Element,
  nodes: HtmlNodesCollection,
  file: VirtualFile,
  options: Options,
): void {
  let firstNonImportElementEncountered = false;
  let lastForElementGroup: null | [HtmlForElement, HtmlElseElement?] = null;
  let lastConditionalElementGroup:
    | null
    | [HtmlIfElement, Array<HtmlElseIfElement>?, HtmlElseElement?] = null;

  traverseHtml(
    parent,
    [
      {
        matches: isHtmlImportElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;

          const explicitlyProvidedAlias = node.attribs.as;

          if (firstNonImportElementEncountered) {
            options.diagnostics.publish(
              createInvalidImportComponentPositionMessage({
                sourceFile: file,
                location: getLocationOfHtmlNode(node),
              }),
            );
          } else if (
            explicitlyProvidedAlias != null &&
            !explicitlyProvidedAlias.trim()
          ) {
            options.diagnostics.publish(
              createEmptyExplicitComponentAliasMessage({
                sourceFile: file,
                location: getLocationOfHtmlNode(node),
              }),
            );
          } else {
            const componentName =
              getFileNameFrom(node.attribs.from, "html") ?? "";

            if (!componentName) {
              options.diagnostics.publish(
                createInvalidFileNameMessage({
                  url: node.attribs.from,
                  extension: "html",
                  location: getLocationOfHtmlNode(node),
                  sourceFile: file,
                }),
              );
            }

            const importedComponentAlias =
              explicitlyProvidedAlias ?? componentName;

            if (importedComponentAlias) {
              const isReservedTag = RESERVED_HTML_ELEMENT_TAGS.includes(
                importedComponentAlias,
              );

              if (isReservedTag) {
                options.diagnostics.publish(
                  createProhibitedReservedComponentRemappingMessage({
                    sourceFile: file,
                    location: getLocationOfHtmlNode(node),
                  }),
                );
              } else {
                nodes.imports[importedComponentAlias] = options.resolveUrl(
                  file,
                  node.attribs.from,
                );
              }
            } else {
              // We already notified about the error.
            }
          }

          // Imports cannot have children.
          return false;
        },
        exit(node) {
          removeElement(node);
        },
      } satisfies HtmlVisitor<HtmlImportElement>,
      {
        matches: isHtmlExportElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          // <export> is allowed before <import>.

          const parent = getParent(node);

          if (parent && isDocument(parent)) {
            if ("name" in node.attribs) {
              nodes.exports[node.attribs.name] = node;
            } else {
              options.diagnostics.publish(
                createNotDefinedExportNameMessage({
                  location: getLocationOfHtmlNode(node),
                  sourceFile: file,
                }),
              );
            }
          } else {
            options.diagnostics.publish(
              createInvalidExportElementPositionMessage({
                location: getLocationOfHtmlNode(node),
                sourceFile: file,
              }),
            );
          }

          // It cannot have children.
          return false;
        },
        exit(node) {
          removeElement(node);
        },
      } satisfies HtmlVisitor<HtmlExportElement>,
      {
        matches: isHtmlRawElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          nodes.raws.push(node);

          if (isHtmlTransferrableElement(node)) {
            nodes.transferrableElements.push(node);
          }

          return false;
        },
      } satisfies HtmlVisitor<HtmlRawElement>,
      {
        matches: isHtmlFragmentElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          if ("name" in node.attribs) {
            const markupFragmentName = node.attribs.name!;

            const isReserved =
              RESERVED_HTML_ELEMENT_TAGS.includes(markupFragmentName);

            if (isReserved) {
              options.diagnostics.publish(
                createProhibitedReservedComponentRemappingMessage({
                  sourceFile: file,
                  location: getLocationOfHtmlNode(node),
                }),
              );
            } else {
              nodes.markupDefinitions[markupFragmentName] = node;
            }

            // Do not visit a markup template.
            return false;
          }

          nodes.fragments.push(node);

          if (isHtmlTransferrableElement(node)) {
            nodes.transferrableElements.push(node);
          }
        },
        exit(node) {
          if ("name" in node.attribs) {
            removeElement(node);
          }
        },
      } satisfies HtmlVisitor<HtmlFragmentElement>,
      {
        matches: isHtmlPortalElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          if ("name" in node.attribs) {
            nodes.portals[node.attribs.name] = node;
          } else {
            options.diagnostics.publish(
              createNotDefinedPortalNameMessage({
                location: getLocationOfHtmlNode(node),
                sourceFile: file,
              }),
            );
            // Current node will be removed, so no need to walk its children.
            return false;
          }
        },
        exit(node) {
          if (!("name" in node.attribs)) {
            removeElement(node);
          }
        },
      } satisfies HtmlVisitor<HtmlPortalElement>,
      {
        matches: isHtmlSlotElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          nodes.slots.push(node);
        },
      } satisfies HtmlVisitor<HtmlSlotElement>,
      {
        matches: isHtmlBuildScriptElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          if ("src" in node.attribs) {
            options.diagnostics.publish(
              createExternalBuildScriptMessage({
                path: node.attribs.src,
                sourceFile: file,
                location: getLocationOfHtmlNode(node),
              }),
            );
          } else {
            nodes.buildScripts.push(node);
          }

          // Build scripts cannot have children with expressions.
          return false;
        },
        exit(node) {
          removeElement(node);
        },
      } satisfies HtmlVisitor<HtmlBuildScriptElement>,
      {
        matches: isHtmlClientScriptElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          nodes.clientScripts.push(node);

          if (isHtmlTransferrableElement(node)) {
            nodes.transferrableElements.push(node);
          }
        },
      } satisfies HtmlVisitor<HtmlClientScriptElement>,
      {
        matches: isHtmlForElement,
        enter(node) {
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          lastForElementGroup = [node];
          nodes.loops.push(lastForElementGroup);

          return false;
        },
      } satisfies HtmlVisitor<HtmlForElement>,
      {
        matches: isHtmlIfElement,
        enter(node) {
          lastForElementGroup = null;
          firstNonImportElementEncountered = true;

          lastConditionalElementGroup = [node];
          nodes.conditionals.push(lastConditionalElementGroup);

          return false;
        },
      } satisfies HtmlVisitor<HtmlIfElement>,
      {
        matches: isHtmlElseIfElement,
        enter(node) {
          lastForElementGroup = null;
          firstNonImportElementEncountered = true;

          if (lastConditionalElementGroup) {
            lastConditionalElementGroup[1] ??= [];
            lastConditionalElementGroup[1].push(node);
          } else {
            options.diagnostics.publish(
              createSingleElseIfElementMessage({
                sourceFile: file,
                location: getLocationOfHtmlNode(node),
              }),
            );
          }

          return false;
        },
      } satisfies HtmlVisitor<HtmlElseIfElement>,
      {
        matches: isHtmlElseElement,
        enter(node) {
          firstNonImportElementEncountered = true;

          // There cannot be a case when both groups
          // are non-null, because it requires both starting nodes
          // be in the same position inside the tree which is impossible.
          if (lastForElementGroup) {
            lastForElementGroup[1] = node;
            lastForElementGroup = null;
          } else if (lastConditionalElementGroup) {
            lastConditionalElementGroup[2] = node;
            lastConditionalElementGroup = null;
          } else {
            options.diagnostics.publish(
              createSingleElseElementMessage({
                sourceFile: file,
                location: getLocationOfHtmlNode(node),
              }),
            );
          }

          return false;
        },
      } satisfies HtmlVisitor<HtmlElseElement>,
      {
        matches: isText,
        enter(node) {
          if (node.data.trim()) {
            lastForElementGroup = null;
            lastConditionalElementGroup = null;

            if (hasAnyInHtmlExpression(node.data)) {
              nodes.texts.push(node);
            }
          }
        },
      } satisfies HtmlVisitor<Text>,
      {
        matches: isTag,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          // Markup definitions have higher priority than imports.
          if (
            node.tagName in nodes.markupDefinitions ||
            nodes.getParentMarkupDefinitionFor?.(node.tagName)
          ) {
            nodes.reusableMarkupReferences.push(node);
          } else if (node.tagName in nodes.imports) {
            const exports: Record<string, string> = {};
            let shouldWalkChildren = true;

            for (const attributeName in node.attribs) {
              if (attributeName.startsWith("assign:")) {
                const exportedName = attributeName.slice(7);

                const importedName =
                  node.attribs[attributeName] || exportedName;

                exports[exportedName] = importedName;
                shouldWalkChildren = false;

                // We don't need to pass the let: attribute as a prop.
                delete node.attribs[attributeName];
              }
            }

            nodes.components.push({
              url: nodes.imports[node.tagName],
              node,
              exports,
              hasAssignDefinitions: !shouldWalkChildren,
            });

            return shouldWalkChildren;
          } else {
            if (
              node.attributes.some((attribute) =>
                hasAnyInHtmlExpression(attribute.value),
              )
            ) {
              nodes.elements.push(node);
            }

            if (isHtmlElementRebaseable(node)) {
              nodes.rebaseableElements.push(node);
            }

            if (isHtmlStyleElement(node)) {
              nodes.styles.push(node);
            }

            if (isHtmlTransferrableElement(node)) {
              nodes.transferrableElements.push(node);
            }
          }
        },
      } satisfies HtmlVisitor<Element>,
    ],
    true,
  );
}
