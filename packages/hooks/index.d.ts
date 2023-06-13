import {
  Getter,
  Setter,
  Effect,
  Context,
  EffectParameters,
  CreateStateOptions,
} from "@moru/context";

export function createState<T>(
  context: Context
): readonly [Getter<T | undefined>, Setter<T | undefined>];
export function createState<T>(
  context: Context,
  initial: T,
  options?: CreateStateOptions<T>
): readonly [Getter<T>, Setter<T>];

export function createEffect(
  context: Context,
  callback: Effect<[]>
): VoidFunction;
export function createEffect<const T extends readonly Getter<unknown>[]>(
  context: Context,
  callback: Effect<EffectParameters<T>>,
  dependencies: T
): void;

export function createUrgentEffect(
  context: Context,
  callback: Effect<[]>
): VoidFunction;
export function createUrgentEffect<const T extends readonly Getter<unknown>[]>(
  context: Context,
  callback: Effect<EffectParameters<T>>,
  dependencies: T
): void;

export function createMemo<T>(
  context: Context,
  callback: (previous: T | null) => T
): Getter<T>;
export function createMemo<T, const D extends readonly Getter<unknown>[]>(
  context: Context,
  callback: (previous: T | null, ...parameters: EffectParameters<D>) => T,
  dependencies: D,
  options?: CreateStateOptions<T>
): Getter<T>;

export type Provider<V> = {
  (properties: { readonly value: V }, context: Context): undefined;
  <C>(
    properties: { readonly value: V; readonly children: C },
    context: Context
  ): C;
};

export function createProvider<T>(initial: T): readonly [Provider<T>, () => T];

export type Resource<R, L> =
  | {
      readonly state: "pending";
    }
  | {
      readonly state: "fulfilled";
      readonly value: R;
    }
  | {
      readonly state: "rejected";
      readonly value: L;
    };

export function createResource<R, L>(
  context: Context,
  fetcher: () => Promise<R>
): Getter<Resource<R, L>>;
export function createResource<
  R,
  L,
  const D extends readonly Getter<unknown>[]
>(
  context: Context,
  fetcher: (...parameters: EffectParameters<D>) => Promise<R>,
  dependencies: D
): Getter<Resource<R, L>>;
