export type Effect = () => void | VoidFunction | Promise<void | VoidFunction>;

export type StateComparator<T> = (previous: T, next: T) => boolean;

declare const GETTER: unique symbol;
declare const CONTEXT: unique symbol;

export type Getter<T> = {
  (): T;
  <A>(map: (value: T) => A): A;
  readonly [GETTER]: null;
};

export type Setter<T> = {
  (map: (value: T) => T): void;
  (value: T): void;
};

export type State<T> = readonly [Getter<T>, Setter<T>];

export type Context = {
  readonly parent?: Context;
  readonly disposed: boolean;
  readonly [CONTEXT]: null;

  dispose(): void;

  state<T>(): State<T | undefined>;
  state<T>(initial: T, equals?: StateComparator<T>): State<T>;

  effect(
    callback: Effect,
    dependencies?: readonly Getter<unknown>[],
    schedule?: (callback: VoidFunction) => void,
  ): VoidFunction;
};

export function context(): Context;

export function isGetter<T>(value: Getter<T>): true;
export function isGetter<T>(value: unknown): value is Getter<T>;

export function isContext(value: Context): true;
export function isContext(value: unknown): value is Context;

export function immediately(callback: VoidFunction): void;
