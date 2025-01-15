import { append, removeElement } from "domutils";
import { type AnyNode, type ChildNode, type Element, isTag } from "domhandler";

import type { Cast } from "./type-utilities.js";
import type { Location } from "./diagnostics.js";

export type HtmlAttributeDescriptorName<D extends HtmlAttributeDescriptor> =
  D extends HtmlRequiredAttribute<infer A>
    ? A
    : D extends HtmlOptionalAttribute<infer A>
      ? A
      : never;

export type HtmlAttributeDescriptorValue<D extends HtmlAttributeDescriptor> =
  D extends HtmlRequiredAttribute<string>
    ? D["__required"]
    : D extends HtmlOptionalAttribute<string>
      ? D["__optional"]
      : never;

export type HtmlRequiredAttribute<
  N extends string,
  V extends string = string,
> = N & {
  __required: V;
};

export type HtmlOptionalAttribute<
  N extends string,
  V extends string = string,
> = N & {
  __optional?: V;
};

export type HtmlAttributeDescriptor =
  | HtmlRequiredAttribute<string>
  | HtmlOptionalAttribute<string>;

export type HtmlAttributes<
  A extends Array<HtmlAttributeDescriptor>,
  R = Record<string, string>,
> = A extends [infer F, ...infer E]
  ? HtmlAttributes<
      Cast<E, Array<HtmlAttributeDescriptor>>,
      R &
        Record<
          HtmlAttributeDescriptorName<Cast<F, HtmlAttributeDescriptor>>,
          HtmlAttributeDescriptorValue<Cast<F, HtmlAttributeDescriptor>>
        >
    >
  : R;

export interface HtmlChildlessElement extends Element {
  children: [];
  childNodes: [];
  firstChild: null;
  lastChild: null;
}

export interface HtmlImportElement extends HtmlChildlessElement {
  attribs: HtmlAttributes<
    [HtmlRequiredAttribute<"from">, HtmlOptionalAttribute<"as">]
  >;
}

export interface HtmlTransferrableElement extends Element {
  attribs: HtmlAttributes<[HtmlOptionalAttribute<"portal">]>;
}

export interface HtmlFragmentElement extends HtmlTransferrableElement {
  attribs: HtmlAttributes<
    [
      HtmlOptionalAttribute<"name">,
      HtmlOptionalAttribute<"slot">,
      HtmlOptionalAttribute<"portal">,
    ]
  >;
}

export interface HtmlRawElement extends HtmlTransferrableElement {
  attribs: HtmlAttributes<
    [HtmlOptionalAttribute<"slot">, HtmlOptionalAttribute<"portal">]
  >;
}

export interface HtmlIfElement extends Element {
  attribs: HtmlAttributes<[HtmlRequiredAttribute<"condition">]>;
}

export interface HtmlElseIfElement extends HtmlIfElement {
  attribs: HtmlAttributes<[HtmlRequiredAttribute<"condition">]>;
}

export interface HtmlElseElement extends Element {}

export interface HtmlForElement extends Element {
  attribs: HtmlAttributes<
    [
      HtmlRequiredAttribute<"each">,
      HtmlOptionalAttribute<"as">,
      HtmlOptionalAttribute<"index">,
    ]
  >;
}

export interface HtmlSlotElement extends Element {
  attribs: HtmlAttributes<[HtmlOptionalAttribute<"name">]>;
}

export interface HtmlPortalElement extends Element {
  attribs: HtmlAttributes<[HtmlRequiredAttribute<"name">]>;
}

export interface HtmlClientScriptElement extends HtmlTransferrableElement {
  attribs: HtmlAttributes<
    [
      HtmlOptionalAttribute<"type", "" | "module" | "text/javascript">,
      HtmlOptionalAttribute<"src">,
      HtmlOptionalAttribute<"slot">,
      HtmlOptionalAttribute<"portal">,
    ]
  >;
}

export interface HtmlBuildScriptElement extends Element {
  attribs: HtmlAttributes<
    [
      HtmlOptionalAttribute<"type", "" | "module" | "text/javascript">,
      HtmlRequiredAttribute<"build">,
    ]
  >;
}

export interface HtmlSlottableElement extends Element {
  attribs: HtmlAttributes<[HtmlOptionalAttribute<"slot">]>;
}

export function getLocationOfHtmlNode(node: AnyNode): Location {
  return {
    start: node.startIndex ?? 0,
    end: node.endIndex ?? 0,
  };
}

export function replaceElementWithMultiple(
  node: ChildNode,
  others: Array<ChildNode>,
): void {
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

function createCustomHtmlElementTagNamePredicate<T extends Element>(
  tagName: string,
) {
  return (node: AnyNode): node is T => isTag(node) && node.tagName === tagName;
}

export const isHtmlImportElement =
  createCustomHtmlElementTagNamePredicate<HtmlImportElement>("import");

export const isHtmlRawElement =
  createCustomHtmlElementTagNamePredicate<HtmlRawElement>("raw");

export const isHtmlFragmentElement =
  createCustomHtmlElementTagNamePredicate<HtmlFragmentElement>("fragment");

export const isHtmlPortalElement =
  createCustomHtmlElementTagNamePredicate<HtmlPortalElement>("portal");

export const isHtmlSlotElement =
  createCustomHtmlElementTagNamePredicate<HtmlSlotElement>("slot");

export const isHtmlScriptElement =
  createCustomHtmlElementTagNamePredicate("script");

export const isHtmlStyleElement =
  createCustomHtmlElementTagNamePredicate("style");

export function isHtmlExecutableScriptElement(node: AnyNode): node is Element {
  return (
    isHtmlScriptElement(node) &&
    (!node.attribs.type ||
      node.attribs.type === "module" ||
      node.attribs.type === "text/javascript")
  );
}

export function isHtmlBuildScriptElement(
  node: AnyNode,
): node is HtmlBuildScriptElement {
  return isHtmlExecutableScriptElement(node) && "build" in node.attribs;
}

export function isHtmlClientScriptElement(
  node: AnyNode,
): node is HtmlClientScriptElement {
  return isHtmlExecutableScriptElement(node) && !("build" in node.attribs);
}

export const isHtmlForElement =
  createCustomHtmlElementTagNamePredicate<HtmlForElement>("for");

export const isHtmlIfElement =
  createCustomHtmlElementTagNamePredicate<HtmlIfElement>("if");

export const isHtmlElseIfElement =
  createCustomHtmlElementTagNamePredicate<HtmlElseIfElement>("else-if");

export const isHtmlElseElement =
  createCustomHtmlElementTagNamePredicate<HtmlElseElement>("else");

export function isHtmlSlottableElement(
  node: AnyNode,
): node is HtmlSlottableElement {
  return isTag(node) && "slot" in node.attribs;
}

export function isHtmlTransferrableElement(
  node: AnyNode,
): node is HtmlTransferrableElement {
  return isTag(node) && "portal" in node.attribs;
}
