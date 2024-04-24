import { Getter } from "./context";
import { JSX, WithChildren } from "./element";

export type ForProperties<A> = {
  readonly key?: <K>(item: A) => K;
  readonly each: Getter<Iterable<A>>;
  readonly children: (item: Getter<A>, index: Getter<number>) => JSX.Node;
  readonly fallback?: JSX.Node;
};

export function For<A>(properties: ForProperties<A>): JSX.Node;

export type ShowProperties<A> = WithChildren<{
  readonly when: Getter<A>;
  readonly fallback?: JSX.Node;
}>;

export function Show<A>(properties: ShowProperties<A>): JSX.Node;
