import { JSX, Component, ComponentContext } from "./element.js";
import { State, Context, Effect, Getter, StateComparator } from "./context.js";

export let currentContext: Context;

export function setCurrentContext(context: Context): void;

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

export function resolve<A>(
  element: JSX.Node,
  positionOffset?: number,
  ignoreHydration?: boolean,
): A;
export function resolve<A>(
  context: ComponentContext,
  element: JSX.Node,
  positionOffset?: number,
  ignoreHydration?: boolean,
): A;

export type Provider<A> = readonly [
  Component<{ readonly value: A; readonly children: JSX.Node }>,
  (context?: Context) => A,
];

export function provider<A>(initial: A): Provider<A>;
