import { Getter, Context } from "./context.js";
import { JSX, WithChildren } from "./element.js";

export type ForProperties<A> = {
  readonly key?: <K>(item: A) => K;
  readonly each: Getter<Iterable<A>>;
  readonly children: (item: Getter<A>, index: Getter<number>) => JSX.Element;
  readonly fallback?: JSX.Element;
};

export function For<A>(
  properties: ForProperties<A>,
  context: Context,
): JSX.Element;

export type ShowProperties<A> = WithChildren<{
  readonly when: Getter<A>;
  readonly fallback?: JSX.Element;
}>;

export function Show<A>(
  properties: ShowProperties<A>,
  context: Context,
): JSX.Element;

export type AwaitProperties<A, E = unknown> = {
  readonly on?: readonly Getter<unknown>[];
  readonly for: () => Promise<A>;
  readonly catch?: (error: Getter<E>, pending: Getter<boolean>) => JSX.Element;
  readonly pending?: JSX.Element;
  readonly children: (
    result: Getter<A>,
    pending: Getter<boolean>,
  ) => JSX.Element;
  readonly transition?: boolean;
};

export function Await<A, E = unknown>(
  properties: AwaitProperties<A, E>,
  context: Context,
): JSX.Element;
