import { Getter, Context } from "./context";
import { JSX, WithChildren } from "./element";

export type ForProperties<A> = {
  readonly key?: <K>(item: A) => K;
  readonly each: Getter<Iterable<A>>;
  readonly children: (item: Getter<A>, index: Getter<number>) => JSX.Node;
  readonly fallback?: JSX.Node;
};

export function For<A>(
  properties: ForProperties<A>,
  context: Context,
): JSX.Node;

export type ShowProperties<A> = WithChildren<{
  readonly when: Getter<A>;
  readonly fallback?: JSX.Node;
}>;

export function Show<A>(
  properties: ShowProperties<A>,
  context: Context,
): JSX.Node;

export type AwaitProperties<A, E = unknown> = {
  readonly on?: readonly Getter<unknown>[];
  readonly for: () => Promise<A>;
  readonly catch?: (error: Getter<E>) => JSX.Node;
  readonly pending?: JSX.Node;
  readonly children: (result: Getter<A>) => JSX.Node;
  readonly transition?: boolean;
};

export function Await<A, E = unknown>(
  properties: AwaitProperties<A, E>,
  context: Context,
): JSX.Node;
