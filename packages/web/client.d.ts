import { JSX, Context, Renderer } from "moru";

// Import types so TS will merge namespaces.
import "./jsx";

export const mount: Renderer<ParentNode>;

export function hydrate(
  context: Context,
  value: JSX.Node,
  root?: ParentNode,
): VoidFunction;
