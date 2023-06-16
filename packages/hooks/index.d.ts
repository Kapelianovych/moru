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

export function createCache<K, V>(
  context: Context,
  key: K,
  value: V
): readonly [() => V, Setter<V>, VoidFunction];

export function createState<T>(
  context: Context
): readonly [Getter<T | undefined>, Setter<T | undefined>, VoidFunction];
export function createState<T>(
  context: Context,
  initial: T,
  options?: CreateStateOptions<T>
): readonly [Getter<T>, Setter<T>, VoidFunction];

export function createEffect(
  context: Context,
  callback: Effect<[]>
): VoidFunction;
export function createEffect<const T extends readonly Getter<unknown>[]>(
  context: Context,
  callback: Effect<EffectParameters<T>>,
  dependencies: T
): VoidFunction;

export function createUrgentEffect(
  context: Context,
  callback: Effect<[]>
): VoidFunction;
export function createUrgentEffect<const T extends readonly Getter<unknown>[]>(
  context: Context,
  callback: Effect<EffectParameters<T>>,
  dependencies: T
): VoidFunction;

export function createMemo<T>(
  context: Context,
  callback: (previous: T | null) => T
): Disposable<Getter<T>>;
export function createMemo<T, const D extends readonly Getter<unknown>[]>(
  context: Context,
  callback: (previous: T | null, ...parameters: EffectParameters<D>) => T,
  dependencies: D,
  options?: CreateStateOptions<T>
): Disposable<Getter<T>>;

export type Provider<Value> = {
  (properties: { readonly value: Value }, context: Context): undefined;
  <Children>(
    properties: { readonly value: Value; readonly children: Children },
    context: Context
  ): Children;
};

export function createProvider<Value>(
  initial: Value
): readonly [Provider<Value>, () => Value, VoidFunction];

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

export type CreateResourceOptions<K> = {
  readonly cacheKey?: K;
};

export function createResource<R, L>(
  context: Context,
  fetcher: () => Promise<R>
): Disposable<Getter<Resource<R, L>>>;
export function createResource<
  R,
  L,
  const D extends readonly Getter<unknown>[],
  K = void
>(
  context: Context,
  fetcher: (...parameters: EffectParameters<D>) => Promise<R>,
  dependencies: D,
  options?: CreateResourceOptions<K>
): Disposable<Getter<Resource<R, L>>>;
