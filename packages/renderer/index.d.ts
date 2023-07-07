import { JSX } from "moru";
import { Context, Getter } from "@moru/context";

export type RendererMethods<I, E> = {
  readonly defaultRoot?: I;
  readonly allowEffects?: boolean;

  setProperty(
    instance: I,
    name: string,
    value: unknown,
    isHydrating: () => boolean,
  ): void;
  appendInstance(parent: I, instance: I, isHydrating: () => boolean): void;
  removeInstance(parent: I, instance: I): void;
  createInstance<T extends string>(
    parent: I,
    tag: T,
    position: number,
    isHydrating: () => boolean,
  ): I;
  insertInstanceAfter(parent: I, sibling: I, instance: I): void;
  createDefaultInstance(
    parent: I,
    element: Exclude<E, JSX.Element | Getter<unknown> | readonly unknown[]>,
    position: number,
    isHydrating: () => boolean,
  ): I;
};

export type Renderer<I, E> = (
  context: Context,
  value: E,
  root?: I,
  hydration?: boolean,
) => VoidFunction;

export function createRenderer<I, E>(
  options: RendererMethods<I, E>,
): Renderer<I, E>;
