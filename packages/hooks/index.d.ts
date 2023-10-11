import {
  Getter,
  Setter,
  Effect,
  Context,
  EffectParameters,
  CreateStateOptions,
} from "@moru/context";

export type Disposable<O extends object> = O & {
  readonly dispose: VoidFunction;
};

export type DisposableGetter<A> = Disposable<Getter<A>>;

export function isDisposableGetter<V>(value: DisposableGetter<V>): true;
export function isDisposableGetter<V>(
  value: unknown,
): value is DisposableGetter<V>;

export function createState<T>(
  context: Context,
): readonly [Getter<T | undefined>, Setter<T | undefined>, VoidFunction];
export function createState<T>(
  context: Context,
  initial: T,
  options?: CreateStateOptions<T>,
): readonly [Getter<T>, Setter<T>, VoidFunction];

export type Scheduler = (callback: VoidFunction) => unknown;

export type EffectCreator = {
  (context: Context, callback: Effect<[]>): VoidFunction;
  <const T extends readonly Getter<unknown>[]>(
    context: Context,
    callback: Effect<EffectParameters<T>>,
    dependencies: T,
  ): VoidFunction;
};

export function createEffectFactory(schedule: Scheduler): EffectCreator;

export const createEffect: EffectCreator;
export const createUrgentEffect: EffectCreator;
export const createImportantEffect: EffectCreator;

export type CreateMemoOptions<A> = {
  equals?(previous: A | undefined, next: A): boolean;
};

export function createMemo<T, const D extends readonly Getter<unknown>[]>(
  context: Context,
  callback: (...parameters: EffectParameters<D>) => T | DisposableGetter<T>,
  dependencies: D,
  options?: CreateMemoOptions<T>,
): DisposableGetter<T>;
export function createMemo<T, const D extends readonly Getter<unknown>[]>(
  context: Context,
  callback: (
    ...parameters: readonly [...EffectParameters<D>, T | undefined]
  ) => T | DisposableGetter<T>,
  dependencies: D,
  options?: CreateMemoOptions<T>,
): DisposableGetter<T>;

export type Provider<Value> = {
  (properties: { readonly value: Value }, context: Context): undefined;
  <Children>(
    properties: { readonly value: Value; readonly children: Children },
    context: Context,
  ): Children;
};

export function createProvider<Value>(
  initial: Value,
): readonly [Provider<Value>, (context: Context) => Value, VoidFunction];

export type Resource<R, L> =
  | {
      readonly state: "loading";
    }
  | {
      readonly state: "loaded";
      readonly value: R;
    }
  | {
      readonly state: "failed";
      readonly value: L;
    };

export type CachedResource<R, L> = {
  readonly resource: Exclude<
    Resource<R, L>,
    { readonly state: "loading" | "failed" }
  >;
  readonly dependencies: string;
};

export type CreateResourceOptions<R, L> = {
  readonly cache?: readonly [
    () =>
      | null
      | undefined
      | CachedResource<R, L>
      | Promise<null | undefined | CachedResource<R, L>>,
    Setter<null | undefined | CachedResource<R, L>>,
    VoidFunction,
  ];
};

export function createResource<R, L>(
  context: Context,
  fetcher: () => Promise<R>,
): DisposableGetter<Resource<R, L>>;
export function createResource<
  R,
  L,
  const D extends readonly Getter<unknown>[],
>(
  context: Context,
  fetcher: (...parameters: EffectParameters<D>) => Promise<R>,
  dependencies: D,
  options?: CreateResourceOptions<R, L>,
): DisposableGetter<Resource<R, L>>;

export type Ref<A> = {
  (ref: A): void;
  readonly current: A;
};

export function createRef<A>(initial?: A): Ref<A>;
