export type Component<Properties extends readonly unknown[], ReturnValue> = (
  ...parameters: Properties
) => ReturnValue;

declare const ELEMENT: unique symbol;

export type IntrinsicElement<
  Tag extends string,
  Properties extends Record<string, unknown>
> = {
  readonly tag: Tag;
  readonly properties: Properties;
  readonly [ELEMENT]: null;
};

export type ComponentElement<
  Properties extends readonly unknown[],
  ReturnValue
> = {
  readonly tag: Component<Properties, ReturnValue>;
  readonly properties: Properties;
  readonly [ELEMENT]: null;
};

export function isElement<
  Tag extends string,
  Properties extends Record<string, unknown>
>(value: unknown): value is IntrinsicElement<Tag, Properties>;
export function isElement<Properties extends readonly unknown[], ReturnValue>(
  value: unknown
): value is ComponentElement<Properties, ReturnValue>;

export const Fragment: unique symbol;

export function createElement<const Children>(
  tag: typeof Fragment,
  properties: {
    readonly children: Children;
  }
): Children;
export function createElement<
  const Tag extends string,
  const Properties extends Record<string, unknown>
>(tag: Tag, options: Properties): IntrinsicElement<Tag, Properties>;
export function createElement<
  const Properties extends readonly unknown[],
  const ReturnValue
>(
  tag: Component<Properties, ReturnValue>,
  properties: Properties
): ComponentElement<Properties, ReturnValue>;

export { createElement as jsx, createElement as jsxs, createElement as jsxDEV };

export namespace JSX {
  type Element =
    | IntrinsicElement<string, Record<string, unknown>>
    | ComponentElement<readonly any[], unknown>;

  type ElementType = string | Component<readonly any[], unknown>;

  interface IntrinsicElements {}

  type ElementChildrenAttribute = {
    children: {};
  };
}
