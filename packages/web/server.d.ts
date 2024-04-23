import { JSX, Context } from "moru";

// Import types so TS will merge namespaces.
import "./jsx";

export function toString(context: Context, value: JSX.Node): string;
