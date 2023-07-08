import { JSX } from "moru";
import { Context } from "@moru/context";
import { Renderer } from "@moru/renderer";

export const mount: Renderer<ParentNode, Node>;

export function hydrate(
  context: Context,
  value: JSX.Node,
  root: ParentNode,
): VoidFunction;
