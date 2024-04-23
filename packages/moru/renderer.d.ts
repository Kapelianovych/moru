import { JSX } from "./element.js";
import { Context, Getter } from "./context.js";

export type RendererMethods<I> = {
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
    element: Exclude<
      JSX.Node,
      JSX.Element | Getter<unknown> | readonly unknown[]
    >,
    position: number,
    isHydrating: () => boolean,
  ): I;
};

export type Renderer<I> = (
  context: Context,
  value: JSX.Node,
  root?: I,
  hydration?: boolean,
) => VoidFunction;

export function renderer<I>(options: RendererMethods<I>): Renderer<I>;
