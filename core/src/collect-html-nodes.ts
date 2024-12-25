import { removeElement } from "domutils";
import {
  type AnyNode,
  type Document,
  type Element,
  isTag,
  isText,
  type Text,
} from "domhandler";

import type { Options } from "./options.js";
import type { VirtualFile } from "./virtual-file.js";
import { hasAnyInHtmlExpression } from "./in-html-expressions.js";
import { isHtmlElementRebaseable } from "./url-rebaser.js";
import { getFileNameFrom, resolveUrl } from "./location.js";
import { type HtmlVisitor, traverseHtml } from "./traverse-html.js";
import {
  createEmptyExplicitComponentAliasMessage,
  createExternalBuildScriptMessage,
  createInvalidFileNameMessage,
  createInvalidImportComponentPositionMessage,
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

export interface HtmlNodesCollection {
  imports: Record<string, string>;

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
  components: Array<[string, Element]>;
  conditionals: Array<
    [HtmlIfElement, Array<HtmlElseIfElement>?, HtmlElseElement?]
  >;
  buildScripts: Array<HtmlBuildScriptElement>;
  clientScripts: Array<HtmlClientScriptElement>;
  /** Elements with attributes which may contain URL. */
  rebaseableElements: Array<Element>;
  transferrableElements: Array<HtmlTransferrableElement>;
}

export function createEmptyHtmlNodesCollection(): HtmlNodesCollection {
  return {
    imports: {},

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
  };
}

/**
 * Groups nodes in one scope.
 * `<if>` and `<for>` elements create inner scope which is not processed
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
              const isReservedTag =
                reservedHtmlElementTags[importedComponentAlias]?.(node) ??
                false;

              if (isReservedTag) {
                options.diagnostics.publish(
                  createProhibitedReservedComponentRemappingMessage({
                    sourceFile: file,
                    location: getLocationOfHtmlNode(node),
                  }),
                );
              } else {
                nodes.imports[importedComponentAlias] = resolveUrl(
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

          nodes.fragments.push(node);

          if (isHtmlTransferrableElement(node)) {
            nodes.transferrableElements.push(node);
          }
        },
      } satisfies HtmlVisitor<HtmlFragmentElement>,
      {
        matches: isHtmlPortalElement,
        enter(node) {
          lastForElementGroup = null;
          lastConditionalElementGroup = null;
          firstNonImportElementEncountered = true;

          nodes.portals[node.attribs.name] = node;
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

          if (node.tagName in nodes.imports) {
            nodes.components.push([nodes.imports[node.tagName], node]);
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

const reservedHtmlElementTags: Record<string, (node: AnyNode) => boolean> = {
  if() {
    return true;
  },
  else() {
    return true;
  },
  "else-if"() {
    return true;
  },
  for() {
    return true;
  },
  raw() {
    return true;
  },
  import() {
    return true;
  },
  script(node) {
    return isHtmlBuildScriptElement(node) || isHtmlClientScriptElement(node);
  },
  portal() {
    return true;
  },
  fragment() {
    return true;
  },
};
