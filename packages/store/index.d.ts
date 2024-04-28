import { Component, Getter, Context, MemoComparator, WithChildren } from "moru";

export type Dispatch<E> = (event: E) => void;

export type Select<A> = <K>(
  selector: (state: A) => K,
  equals?: MemoComparator<K>,
) => Getter<K>;

export type StoreProvider = Component<WithChildren>;

export type UseStore<A, E> = (
  context?: Context,
) => readonly [Select<A>, Dispatch<E>];

export type Store<A, E> = readonly [StoreProvider, UseStore<A, E>];

export function store<A, E>(
  initial: A,
  reducer: (state: A, event: E) => Partial<A> | null | undefined,
): Store<A, E>;
