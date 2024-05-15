import { JSX, Context } from "moru";

// Import types so TS will merge namespaces.
import "./jsx.js";

export function toString(context: Context, value: JSX.Element): string;
