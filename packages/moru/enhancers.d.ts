import { JSX, Component } from "./element";
import { State, Context, Effect, Getter, StateComparator } from "./context";

export interface CurrentContext {
  ref?: Context;
  (context: Context): void;
}

export const currentContext: CurrentContext;

export type CachedNode<I> = {
  node: JSX.Node;
  context: Context;
  instance?: I;
};

export function cached<I>(node: JSX.Node): CachedNode<I>;
export function cached<I>(context: Context, node: JSX.Node): CachedNode<I>;

export function discard<I>(node: CachedNode<I>): void;

export type Ref<A> = {
  (): A;
  (value: A): void;
};

export function ref<A>(initial?: A): Ref<A>;

export function state<T>(): State<T | undefined>;
export function state<T>(context: Context): State<T | undefined>;
export function state<T>(initial: T, equals?: StateComparator<T>): State<T>;
export function state<T>(
  context: Context,
  initial: T,
  equals?: StateComparator<T>,
): State<T>;

export type MemoComparator<A> = (previous: A | undefined, next: A) => boolean;

export function memo<A>(
  callback: (previous: A | undefined) => A,
  dependencies?: readonly Getter<unknown>[],
  equals?: MemoComparator<A>,
): Getter<A>;
export function memo<A>(
  context: Context,
  callback: (previous: A | undefined) => A,
  dependencies?: readonly Getter<unknown>[],
  equals?: MemoComparator<A>,
): Getter<A>;

export function effect(
  callback: Effect,
  dependencies?: readonly Getter<unknown>[],
  schedule?: (callback: VoidFunction) => void,
): VoidFunction;
export function effect(
  context: Context,
  callback: Effect,
  dependencies?: readonly Getter<unknown>[],
  schedule?: (callback: VoidFunction) => void,
): VoidFunction;

export type Provider<A> = readonly [
  Component<{ readonly value: A; readonly children: JSX.Node }>,
  (context?: Context) => A,
];

export function provider<A>(initial: A): Provider<A>;
