declare const ElementTag: unique symbol;

declare global {
  namespace JSX {
    interface RegularElementsMap {}

    type Component<T = {}> = (properties: T) => Element;

    type FragmentElement = {
      readonly tag: "fragment";
      readonly children?: Element;
      readonly [ElementTag]: null;
    };

    type RegularElement<K extends keyof RegularElementsMap> = {
      readonly tag: K;
      readonly ref?: (element: RegularElementsMap[K]["ref"]) => void;
      readonly children?: Element;
      readonly attributes: Omit<RegularElementsMap[K], "ref">;
      readonly [ElementTag]: null;
    };

    interface ElementMap {
      readonly 0: null;
      readonly 1: string;
      readonly 2: number;
      readonly 3: bigint;
      readonly 4: boolean;
      readonly 5: undefined;
      readonly 6: () => Element;
      readonly 7: RegularElement<keyof RegularElementsMap>;
      readonly 8: FragmentElement;
    }

    type Element = ElementMap[keyof ElementMap] | readonly Element[];

    type WithRef<A, R> = A & {
      readonly ref: (element: R) => void;
    };

    type WithChildren<A, C = Element> = A & {
      readonly children: C;
    };
  }
}

export function Fragment(children?: JSX.Element): JSX.FragmentElement;

export function createElement<K extends keyof JSX.RegularElementsMap>(
  tag: K,
  options: JSX.RegularElementsMap[K]
): JSX.Element;
export function createElement<T>(
  tag: JSX.Component<T>,
  options: T
): JSX.Element;

export function isJSXCoreElement<T extends keyof JSX.RegularElementsMap>(
  value: unknown
): value is JSX.RegularElement<T> | JSX.FragmentElement;

export { createElement as jsx, createElement as jsxs, createElement as jsxDEV };

export type StateGetter<T> = () => T;

export type StateSetter<T> = {
  (value: T): void;
  (fn: (old: T) => T): void;
};

export type UseStateOptions<T> = {
  readonly equals?: (previous: T, next: T) => boolean;
};

export function useState<T>(): readonly [
  StateGetter<T | undefined>,
  StateSetter<T | undefined>
];
export function useState<T>(
  value: T,
  options?: UseStateOptions<T>
): readonly [StateGetter<T>, StateSetter<T>];

export function useEffect(callback: () => void | VoidFunction): void;

export function useImmediateEffect(callback: () => void | VoidFunction): void;

export function useFree<T>(callback: () => T): T;

export function onError<E>(callback: (error: E) => void): void;
