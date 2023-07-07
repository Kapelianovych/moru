import { Context } from "@moru/context";
import { Renderer } from "@moru/renderer";

import { Node } from "./jsx.js";

export const mount: Renderer<ParentNode, Node>;

export function hydrate(
  context: Context,
  value: Node,
  root: ParentNode,
): VoidFunction;
