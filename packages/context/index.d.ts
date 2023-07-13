export type Effect<T extends readonly unknown[]> = (
  ...parameters: T
) => void | VoidFunction | Promise<void | VoidFunction>;

export type CreateStateOptions<T> = {
  equals?(previous: T, next: T): boolean;
};

declare const GETTER: unique symbol;

export type Getter<T> = {
  (): T;
  // This property is not an exact correspondence to the assigned symbol
  // but it makes the getter function unique which is the only requirement.
  readonly [GETTER]: null;
};

export type Setter<T> = {
  (map: (current: T) => T): void;
  (value: T): void;
};

export type EffectParameters<T extends readonly Getter<unknown>[]> = {
  readonly [K in keyof T]: ReturnType<T[K]>;
};

export type Context = {
  readonly disposed: boolean;

  dispose(): void;

  createState<T>(): readonly [
    Getter<T | undefined>,
    Setter<T | undefined>,
    VoidFunction,
  ];
  createState<T>(
    initial: T,
    options?: CreateStateOptions<T>,
  ): readonly [Getter<T>, Setter<T>, VoidFunction];

  createEffect(callback: Effect<[]>): VoidFunction;
  createEffect<const T extends readonly Getter<unknown>[]>(
    callback: Effect<EffectParameters<T>>,
    dependencies: T,
  ): VoidFunction;

  createUrgentEffect(callback: Effect<[]>): VoidFunction;
  createUrgentEffect<const T extends readonly Getter<unknown>[]>(
    callback: Effect<EffectParameters<T>>,
    dependencies: T,
  ): VoidFunction;
};

export type ChildContext = Context & {
  readonly parent: Context | ChildContext;
};

export function createContext(): Context;

export function createChildContext(
  parent: Context | ChildContext,
): ChildContext;

export function isGetter<T>(value: Getter<T>): true;
export function isGetter<T>(value: unknown): value is Getter<T>;
