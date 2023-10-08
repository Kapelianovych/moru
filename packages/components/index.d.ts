import { JSX } from "moru";
import { Getter } from "@moru/context";

export type ForProperties<A> = {
  readonly key?: <K>(item: A) => K;
  readonly each: Getter<Iterable<A>>;
  readonly children: (item: Getter<A>, index: Getter<number>) => JSX.Node;
  readonly fallback?: JSX.Node;
};

export function For<A>(properties: ForProperties<A>): JSX.Node;
