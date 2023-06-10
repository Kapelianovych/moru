import { Context } from "@moru/context";
import { Element, RegularElementsMap } from "moru";

export type RendererMethods<I> = {
  readonly allowEffects?: boolean;

  appendChild(parent: I, instance: I): void;
  removeInstance(instance: I): void;
  createInstance<T extends keyof RegularElementsMap>(tag: T): I;
  setProperty(instance: I, name: string, value: unknown): void;
  insertInstanceAfter(sibling: I, instance: I): void;
  createDefaultInstance(element: Element): I;
};

export function createRenderer<I>(
  options: RendererMethods<I>
): (context: Context, value: Element, root: I) => VoidFunction;
