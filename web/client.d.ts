import { JSX, Context, Renderer } from "moru";

// Import types so TS will merge namespaces.
import "./jsx.js";

export const mount: Renderer<ParentNode>;

export function hydrate(
  context: Context,
  value: JSX.Element,
  root?: ParentNode,
): VoidFunction;
