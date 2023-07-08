import { JSX } from "moru";
import { Context } from "@moru/context";

// Import types so TS will merge namespaces.
import './jsx.js';

export function renderToString(context: Context, value: JSX.Node): string;
