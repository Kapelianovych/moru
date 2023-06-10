export interface RegularElementsMap {}

interface ElementMap {
  readonly 0: null;
  readonly 1: string;
  readonly 2: number;
  readonly 3: bigint;
  readonly 4: boolean;
  readonly 5: undefined;
  readonly 7: RegularElement<keyof RegularElementsMap>;
  readonly 8: FragmentElement;
}

export type Element = ElementMap[keyof ElementMap] | readonly Element[];

export type Component<Properties = {}, Context = {}> = (
  properties: Properties,
  context: Context
) => Element | Promise<Element>;

export type FragmentElement = {
  readonly tag: "fragment";
  readonly children: Element;
};

type RegularElement<Tag extends keyof RegularElementsMap> = {
  readonly tag: Tag;
  readonly children?: Element;
  readonly attributes: RegularElementsMap[Tag];
};

export function Fragment(children?: Element): FragmentElement;

export function createElement<Tag extends keyof RegularElementsMap>(
  tag: Tag,
  options: RegularElementsMap[Tag]
): Element;
export function createElement<Properties>(
  tag: Component<Properties>,
  options: Properties
): Element;

export function isElement<Tag extends keyof RegularElementsMap>(
  value: unknown
): value is RegularElement<Tag> | FragmentElement;

export { createElement as jsx, createElement as jsxs, createElement as jsxDEV };
