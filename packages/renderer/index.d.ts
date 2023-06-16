import { Context } from "@moru/context";
import { ComponentElement, IntrinsicElement } from "moru";

export type RendererMethods<I, E> = {
  readonly defaultRoot?: I;
  readonly allowEffects?: boolean;

  setProperty(instance: I, name: string, value: unknown): void;
  appendInstance(parent: I, instance: I): void;
  removeInstance(parent: I, instance: I): void;
  createInstance<T extends string>(parent: I, tag: T): I;
  insertInstanceAfter(parent: I, sibling: I, instance: I): void;
  createDefaultInstance(
    parent: I,
    element: null | string | number | bigint | boolean | undefined | E
  ): I;
};

export type Renderer<I, E> = {
  <Tag extends string, Properties extends Record<string, unknown>>(
    context: Context,
    value: IntrinsicElement<Tag, Properties>,
    root?: I
  ): VoidFunction;
  <Properties extends Record<string, unknown>, ReturnValue>(
    context: Context,
    value: ComponentElement<Properties, ReturnValue>,
    root?: I
  ): VoidFunction;
  (
    context: Context,
    value: readonly (
      | null
      | string
      | number
      | bigint
      | boolean
      | undefined
      | E
      | IntrinsicElement<string, Record<string, unknown>>
      | ComponentElement<Record<string, unknown>, unknown>
    )[],
    root?: I
  ): VoidFunction;
  (
    context: Context,
    value: null | string | number | bigint | boolean | undefined | E,
    root?: I
  ): VoidFunction;
};

export function createRenderer<I, E = never>(
  options: RendererMethods<I, E>
): Renderer<I, E>;
