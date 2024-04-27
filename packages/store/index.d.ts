import { Component, Context, Getter, MemoComparator, WithChildren } from "moru";

export type Dispatch<E> = (event: E) => void;

export type Dispatcher<E> = (context?: Context) => Dispatch<E>;

export type Select<A> = {
  <K>(selector: (state: A) => K, equals?: MemoComparator<K>): Getter<K>;
  <K>(
    context: Context,
    selector: (state: A) => K,
    equals?: MemoComparator<K>,
  ): Getter<K>;
};

export type StoreProvider = Component<WithChildren>;

export type Store<A, E> = [StoreProvider, Select<A>, Dispatcher<E>];

export function store<A, E>(
  initial: A,
  reducer: (state: A, event: E) => Partial<A> | null | undefined,
): Store<A, E>;
