import { Context } from "@moru/context";
import { Element, RegularElementsMap } from "moru";

export type RendererMethods<I> = {
  readonly defaultRoot?: I;
  readonly allowEffects?: boolean;

  setProperty(instance: I, name: string, value: unknown): void;
  appendInstance(parent: I, instance: I): void;
  removeInstance(parent: I, instance: I): void;
  createInstance<T extends keyof RegularElementsMap>(parent: I, tag: T): I;
  insertInstanceAfter(parent: I, sibling: I, instance: I): void;
  createDefaultInstance(parent: I, element: Element): I;
};

export function createRenderer<I>(
  options: RendererMethods<I>
): (context: Context, value: Element, root?: I) => VoidFunction;
