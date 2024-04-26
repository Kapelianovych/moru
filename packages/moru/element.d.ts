import { Context } from "./context";
import { CachedNode } from "./enhancers";

export type WithChildren<A = {}> = A & {
  readonly children?: JSX.Node;
};

export type Component<Properties extends object> = (
  properties: Properties,
  context: Context,
) => JSX.Node;

declare const ELEMENT: unique symbol;

export type IntrinsicElement<Tag extends string, Properties extends object> = {
  readonly tag: Tag;
  readonly properties: Properties;
  readonly [ELEMENT]: null;
};

export type ComponentElement<Properties extends object> = {
  readonly tag: Component<Properties>;
  readonly properties: Properties;
  readonly [ELEMENT]: null;
};

export function isElement<Tag extends string, Properties extends object>(
  value: unknown,
): value is IntrinsicElement<Tag, Properties>;
export function isElement<Properties extends object>(
  value: unknown,
): value is ComponentElement<Properties>;

export const Fragment: unique symbol;

export function createElement<const Children>(
  tag: typeof Fragment,
  properties: WithChildren,
): Children;
export function createElement<
  const Tag extends string,
  const Properties extends object,
>(tag: Tag, options: Properties): IntrinsicElement<Tag, Properties>;
export function createElement<const Properties extends object>(
  tag: Component<Properties>,
  properties: Properties,
): ComponentElement<Properties>;

export { createElement as jsx, createElement as jsxs, createElement as jsxDEV };

export namespace JSX {
  // Runtimes for the moru has to declare the "Node" type
  // which will describe values that are allowed as children
  // of the Element instance.

  type Element =
    | IntrinsicElement<string, object>
    | ComponentElement<object>
    | CachedNode<unknown>;

  type ElementType = string | Component<object>;

  interface IntrinsicElements {}

  interface ElementChildrenAttribute {
    readonly children: null;
  }

  interface ElementClass {
    // empty, libraries can define requirements downstream
  }

  interface ElementAttributesProperty {
    // empty, libraries can define requirements downstream
  }
}
