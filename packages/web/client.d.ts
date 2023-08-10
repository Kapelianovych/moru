import { JSX } from "moru";
import { Context } from "@moru/context";
import { Renderer } from "@moru/renderer";

// Import types so TS will merge namespaces.
import "./jsx.js";

export const mount: Renderer<ParentNode, JSX.Node>;

export function hydrate(
  context: Context,
  value: JSX.Node,
  root?: ParentNode,
): VoidFunction;
