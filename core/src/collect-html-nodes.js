/** @import { Text, Element, Document } from 'domhandler'; */

/**
 * @import { Options } from "./options.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { HtmlVisitor } from "./traverse-html.js";
 * @import { HtmlBuildScriptElement,
 *   HtmlClientScriptElement,
 *   HtmlElseElement,
 *   HtmlElseIfElement,
 *   HtmlExportElement,
 *   HtmlForElement,
 *   HtmlFragmentElement,
 *   HtmlIfElement,
 *   HtmlImportElement,
 *   HtmlPortalElement,
 *   HtmlRawElement,
 *   HtmlSlotElement,
 *   HtmlTransferrableElement,
 *   HTMLDynamicElement,
 * } from "./html-nodes.js";
 */

import { getParent, removeElement } from "domutils";
import { isDocument, isTag, isText } from "domhandler";

import { getFileNameFrom } from "./location.js";
import { hasAnyInHtmlExpression } from "./in-html-expressions.js";
import { isHtmlElementRebaseable } from "./url-rebaser.js";
import { traverseHtml } from "./traverse-html.js";
import {
  createEmptyExplicitComponentAliasMessage,
  createInvalidExportElementPositionMessage,
  createInvalidNameOfImportedComponentMessage,
  createInvalidImportComponentPositionMessage,
  createNotDefinedExportNameMessage,
  createNotDefinedPortalNameMessage,
  createProhibitedReservedComponentRemappingMessage,
  createSingleElseElementMessage,
  createSingleElseIfElementMessage,
} from "./diagnostics.js";
import {
  getLocationOfHtmlNode,
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
  isHtmlDynamicElement,
} from "./html-nodes.js";

export const RESERVED_HTML_ELEMENT_TAGS = [
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
  "dynamic",
];
const ASSIGN_ATTRIBUTE_PREFIX = "assign:";
const SUPPORTED_IMPORT_EXTENSIONS = ["svg", "html"];

/**
 * @typedef {Object} ComponentDefinition
 * @property {string} url
 * @property {Element} node
 * @property {Record<string, string>} assignedAttributes Variables which are expected to be exported
 *  from a component to be used in passed children.
 */

/**
 * @typedef {Object} HtmlNodesCollection
 * @property {Record<string, string>} imports
 * @property {Record<string, Element>} exports
 * @property {Record<string, HtmlFragmentElement>} markupDefinitions Locally defined reusable fragments of markup.
 * @property {function(string): HtmlFragmentElement | undefined} [getParentMarkupDefinitionFor] Optionally gets the
 *  parent markup definition for a given name.
 * @property {Array<HtmlRawElement>} raws
 * @property {Array<[HtmlForElement, HtmlElseElement?]>} loops
 * @property {Array<HtmlSlotElement>} slots
 * @property {Array<Text>} texts Texts with at least one expression.
 * @property {Array<Element>} styles
 * @property {Record<string, HtmlPortalElement>} portals
 * @property {Array<Element>} elements Elements with an expression in at least one attribute.
 * @property {Array<HtmlFragmentElement>} fragments
 * @property {Array<ComponentDefinition>} components
 * @property {Array<[HtmlIfElement, Array<HtmlElseIfElement>?, HtmlElseElement?]>} conditionals
 * @property {Array<HtmlBuildScriptElement>} buildScripts
 * @property {Array<HtmlClientScriptElement>} clientScripts
 * @property {Array<Element>} rebaseableElements Elements with attributes which may contain URLs.
 * @property {Array<HtmlTransferrableElement>} transferrableElements
 * @property {Array<Element>} reusableMarkupReferences
 * @property {Array<HTMLDynamicElement>} dynamicElements
 */

/**
 * @returns {HtmlNodesCollection}
 */
export function createEmptyHtmlNodesCollection() {
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
    dynamicElements: [],
    rebaseableElements: [],
    transferrableElements: [],
    reusableMarkupReferences: [],
  };
}

/**
 * Groups nodes in one scope.
 * `<if>` and `<for>` elements create an inner scope which is not processed
 * along with a parent scope.
 *
 * @param {Document | Element} parent
 * @param {HtmlNodesCollection} nodes
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {void}
 */
export function collectHtmlNodes(parent, nodes, file, options) {
  let firstNonImportElementEncountered = false;
  /** @type {null | [HtmlForElement, HtmlElseElement?]} */
  let lastForElementGroup = null;
  /** @type {null | [HtmlIfElement, Array<HtmlElseIfElement>?, HtmlElseElement?]} */
  let lastConditionalElementGroup = null;

  traverseHtml(
    parent,
    [
      /** @satisfies {HtmlVisitor<HtmlImportElement>} */ ({
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
              getFileNameFrom(node.attribs.from, SUPPORTED_IMPORT_EXTENSIONS) ??
              "";

            if (!componentName) {
              options.diagnostics.publish(
                createInvalidNameOfImportedComponentMessage({
                  url: node.attribs.from,
                  allowedExtensions: SUPPORTED_IMPORT_EXTENSIONS,
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
                    remapFor: "custom-component",
                    reservedComponentName: importedComponentAlias,
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
      }),
      /** @satisfies {HtmlVisitor<HtmlExportElement>} */ ({
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
      }),
      /** @satisfies {HtmlVisitor<HtmlRawElement>} */ ({
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
      }),
      /** @satisfies {HtmlVisitor<HtmlFragmentElement>} */ ({
        matches: isHtmlFragmentElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          if ("name" in node.attribs) {
            const markupFragmentName = /** @type {string} */ (
              node.attribs.name
            );

            const isReserved =
              RESERVED_HTML_ELEMENT_TAGS.includes(markupFragmentName);

            if (isReserved) {
              options.diagnostics.publish(
                createProhibitedReservedComponentRemappingMessage({
                  remapFor: "named-fragment",
                  reservedComponentName: markupFragmentName,
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
      }),
      /** @satisfies {HtmlVisitor<HtmlPortalElement>} */ ({
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
      }),
      /** @satisfies {HtmlVisitor<HtmlSlotElement>} */ ({
        matches: isHtmlSlotElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          nodes.slots.push(node);
        },
      }),
      /** @satisfies {HtmlVisitor<HtmlBuildScriptElement>} */ ({
        matches: isHtmlBuildScriptElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          nodes.buildScripts.push(node);

          // Build scripts cannot have children with expressions.
          return false;
        },
        exit(node) {
          removeElement(node);
        },
      }),
      /** @satisfies {HtmlVisitor<HtmlClientScriptElement>} */ ({
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
      }),
      /** @satisfies {HtmlVisitor<HtmlForElement>} */ ({
        matches: isHtmlForElement,
        enter(node) {
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          lastForElementGroup = [node];
          nodes.loops.push(lastForElementGroup);

          return false;
        },
      }),
      /** @satisfies {HtmlVisitor<HtmlIfElement>} */ ({
        matches: isHtmlIfElement,
        enter(node) {
          lastForElementGroup = null;
          firstNonImportElementEncountered = true;

          lastConditionalElementGroup = [node];
          nodes.conditionals.push(lastConditionalElementGroup);

          return false;
        },
      }),
      /** @satisfies {HtmlVisitor<HtmlElseIfElement>} */ ({
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
      }),
      /** @satisfies {HtmlVisitor<HtmlElseElement>} */ ({
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
      }),
      /** @satisfies {HtmlVisitor<Text>} */ ({
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
        exit(node) {
          // Remove whitespace nodes as they are not of any use.
          if (!node.data.trim()) {
            removeElement(node);
          }
        },
      }),
      /**
       * @satisfies {HtmlVisitor<HTMLDynamicElement>}
       */
      ({
        matches: isHtmlDynamicElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          nodes.dynamicElements.push(node);

          return false;
        },
      }),
      /** @satisfies {HtmlVisitor<Element>} */ ({
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
            /** @type {Record<string, string>} */
            const assignedAttributes = {};

            for (const attributeName in node.attribs) {
              if (attributeName.startsWith(ASSIGN_ATTRIBUTE_PREFIX)) {
                const exportedName = attributeName.slice(
                  ASSIGN_ATTRIBUTE_PREFIX.length,
                );

                const importedName =
                  node.attribs[attributeName] || exportedName;

                assignedAttributes[exportedName] = importedName;

                // We don't need to pass this attribute as a prop.
                delete node.attribs[attributeName];
              }
            }

            nodes.components.push({
              url: nodes.imports[node.tagName],
              node,
              assignedAttributes,
            });

            // Children are going to be evaluated if component can accept them.
            return false;
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
      }),
    ],
    true,
  );
}
