import { Context } from "./context.js";
import { CachedNode } from "./enhancers.js";

export type WithRef<R, P = {}> = P & {
  readonly ref?: (ref: R) => void;
};

export type WithChildren<A = {}> = A & {
  readonly children?: JSX.Element;
};

export type Component<Properties extends object> = (
  properties: Properties,
  context: Context,
) => JSX.Element;

declare const ELEMENT: unique symbol;

export interface Element<
  Tag extends string | Component<object>,
  Properties extends object,
> {
  readonly tag: Tag;
  readonly properties: Properties;
  readonly [ELEMENT]: typeof ELEMENT;
}

export interface IntrinsicElement<Tag extends string, Properties extends object>
  extends Element<Tag, Properties> {}

export interface ComponentElement<Properties extends object>
  extends Element<Component<Properties>, Properties> {}

export function isElement<
  Tag extends string | Component<object>,
  Properties extends object,
>(value: Element<Tag, Properties>): true;
export function isElement(value: unknown): boolean;

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
  // Runtimes for the moru has to extend the "ElementVariants" interface
  // which will describe values that are allowed as children
  // of the Element instance.
  interface ElementVariants {
    0: IntrinsicElement<string, object>;
    1: ComponentElement<object>;
    2: CachedNode<unknown>;
  }

  type Element =
    | ElementVariants[keyof ElementVariants]
    | readonly Element[]
    // This is effectively the Getter, but TS does not allow
    // circular type applications :(
    | (() => Element);

  type ElementType = string | Component<any>;

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
