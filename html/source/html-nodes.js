/**
 * @import { AnyNode, ChildNode, Element } from 'domhandler';
 *
 * @import { Cast } from "./type-utilities.js";
 * @import { Location } from "./diagnostics.js";
 */

import { isTag } from "domhandler";
import { append, removeElement } from "domutils";

/**
 * @template {HtmlAttributeDescriptor} D
 * @typedef {D extends HtmlRequiredAttribute<infer A>
 *   ? A
 *   : D extends HtmlOptionalAttribute<infer A>
 *     ? A
 *     : never
 * } HtmlAttributeDescriptorName
 */

/**
 * @template {HtmlAttributeDescriptor} D
 * @typedef { D extends HtmlRequiredAttribute<string>
 *   ? D["__required"]
 *   : D extends HtmlOptionalAttribute<string>
 *     ? D["__optional"]
 *     : never
 * } HtmlAttributeDescriptorValue
 */

/**
 * @template {string} N
 * @template {string} [V = string]
 * @typedef {N & { __required: V }} HtmlRequiredAttribute
 */

/**
 * @template {string} N
 * @template {string} [V = string]
 * @typedef {N & { __optional?: V }} HtmlOptionalAttribute
 */

/**
 * @typedef {HtmlRequiredAttribute<string> | HtmlOptionalAttribute<string>} HtmlAttributeDescriptor
 */

/**
 * @template {Array<HtmlAttributeDescriptor>} A
 * @template [R = Record<string, string>]
 * @typedef {A extends [infer F, ...infer E]
 *   ? HtmlAttributes<
 *       Cast<E, Array<HtmlAttributeDescriptor>>,
 *       R &
 *         Record<
 *           HtmlAttributeDescriptorName<Cast<F, HtmlAttributeDescriptor>>,
 *           HtmlAttributeDescriptorValue<Cast<F, HtmlAttributeDescriptor>>
 *         >
 *     >
 *   : R
 * } HtmlAttributes
 */

/**
 * @private
 * @typedef {Object} HtmlChildlessElementOverrides
 * @property {[]} children
 * @property {[]} childNodes
 * @property {null} firstChild
 * @property {null} lastChild
 *
 * @typedef {Element & HtmlChildlessElementOverrides} HtmlChildlessElement
 */

/**
 * @typedef {HtmlChildlessElement &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlRequiredAttribute<"from">, HtmlOptionalAttribute<"as">]
 *     >;
 *   }
 * } HtmlImportElement
 */

/**
 * @typedef {HtmlChildlessElement &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlRequiredAttribute<"name">, HtmlOptionalAttribute<"as">]
 *     >;
 *   }
 * } HtmlExportElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlOptionalAttribute<"portal">]
 *     >;
 *   }
 * } HtmlTransferrableElement
 */

/**
 * @typedef {HtmlTransferrableElement &
 *   {
 *     attribs: HtmlAttributes<
 *       [
 *         HtmlOptionalAttribute<"name">,
 *         HtmlOptionalAttribute<"slot">,
 *         HtmlOptionalAttribute<"portal">,
 *       ]
 *     >;
 *   }
 * } HtmlFragmentElement
 */

/**
 * @typedef {HtmlTransferrableElement &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlOptionalAttribute<"slot">, HtmlOptionalAttribute<"portal">]
 *     >;
 *   }
 * } HtmlRawElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlRequiredAttribute<"condition">]
 *     >;
 *   }
 * } HtmlIfElement
 */

/**
 * @typedef {HtmlIfElement} HtmlElseIfElement
 */

/**
 * @typedef {Element} HtmlElseElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [
 *         HtmlRequiredAttribute<"each">,
 *         HtmlOptionalAttribute<"as">,
 *         HtmlOptionalAttribute<"index">,
 *       ]
 *     >;
 *   }
 * } HtmlForElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlOptionalAttribute<"name">]
 *     >;
 *   }
 * } HtmlSlotElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlRequiredAttribute<"name">]
 *     >;
 *   }
 * } HtmlPortalElement
 */

/**
 * @typedef {HtmlTransferrableElement &
 *   {
 *     attribs: HtmlAttributes<
 *       [
 *         HtmlOptionalAttribute<"type", "" | "module" | "text/javascript">,
 *         HtmlOptionalAttribute<"src">,
 *         HtmlOptionalAttribute<"slot">,
 *         HtmlOptionalAttribute<"portal">,
 *       ]
 *     >;
 *   }
 * } HtmlClientScriptElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [
 *         HtmlOptionalAttribute<"src">,
 *         HtmlOptionalAttribute<"type", "" | "module" | "text/javascript">,
 *         HtmlRequiredAttribute<"build">,
 *       ]
 *     >;
 *   }
 * } HtmlBuildScriptElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlOptionalAttribute<"slot">]
 *     >;
 *   }
 * } HtmlSlottableElement
 */

/**
 * @typedef {Element &
 *   {
 *     attribs: HtmlAttributes<
 *       [HtmlRequiredAttribute<"tag">]
 *     >
 *   }
 * } HTMLDynamicElement
 */

/**
 * @param {AnyNode} node
 * @returns {Location}
 */
export function getLocationOfHtmlNode(node) {
  return {
    start: node.startIndex ?? 0,
    end: node.endIndex ?? 0,
  };
}

/**
 * @param {ChildNode} node
 * @param {Array<ChildNode>} others
 * @returns {void}
 */
export function replaceElementWithMultiple(node, others) {
  let previousNode = node;
  // We have to clone the list here, because it can be a direct
  // reference to a children property of a parent of each item.
  // `append` function modifies that array, thus iterator may
  // skip some elements.
  for (const nextNode of [...others]) {
    append(previousNode, nextNode);
    previousNode = nextNode;
  }
  removeElement(node);
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlImportElement}
 */
export function isHtmlImportElement(node) {
  return isTag(node) && node.tagName === "import";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlExportElement}
 */
export function isHtmlExportElement(node) {
  return isTag(node) && node.tagName === "export";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlRawElement}
 */
export function isHtmlRawElement(node) {
  return isTag(node) && node.tagName === "raw";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlFragmentElement}
 */
export function isHtmlFragmentElement(node) {
  return isTag(node) && node.tagName === "fragment";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlPortalElement}
 */
export function isHtmlPortalElement(node) {
  return isTag(node) && node.tagName === "portal";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlSlotElement}
 */
export function isHtmlSlotElement(node) {
  return isTag(node) && node.tagName === "slot";
}

/**
 * @param {AnyNode} node
 * @returns {node is Element}
 */
export function isHtmlScriptElement(node) {
  return isTag(node) && node.tagName === "script";
}

/**
 * @param {AnyNode} node
 * @returns {node is Element}
 */
export function isHtmlStyleElement(node) {
  return isTag(node) && node.tagName === "style";
}

/**
 * @param {AnyNode} node
 * @returns {node is Element}
 */
export function isHtmlExecutableScriptElement(node) {
  return (
    isHtmlScriptElement(node) &&
    (!node.attribs.type ||
      node.attribs.type === "module" ||
      node.attribs.type === "text/javascript")
  );
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlBuildScriptElement}
 */
export function isHtmlBuildScriptElement(node) {
  return isHtmlExecutableScriptElement(node) && "build" in node.attribs;
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlClientScriptElement}
 */
export function isHtmlClientScriptElement(node) {
  return isHtmlExecutableScriptElement(node) && !("build" in node.attribs);
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlForElement}
 */
export function isHtmlForElement(node) {
  return isTag(node) && node.tagName === "for";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlIfElement}
 */
export function isHtmlIfElement(node) {
  return isTag(node) && node.tagName === "if";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlElseIfElement}
 */
export function isHtmlElseIfElement(node) {
  return isTag(node) && node.tagName === "else-if";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlElseElement}
 */
export function isHtmlElseElement(node) {
  return isTag(node) && node.tagName === "else";
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlSlottableElement}
 */
export function isHtmlSlottableElement(node) {
  return isTag(node) && "slot" in node.attribs;
}

/**
 * @param {AnyNode} node
 * @returns {node is HtmlTransferrableElement}
 */
export function isHtmlTransferrableElement(node) {
  return isTag(node) && "portal" in node.attribs;
}

/**
 * @param {AnyNode} node
 * @returns {node is HTMLDynamicElement}
 */
export function isHtmlDynamicElement(node) {
  return isTag(node) && node.tagName === "dynamic";
}
