import { Component, Fragment, WithChildren } from "./index.js";

export function jsx(
  tag: string | Component,
  options: Record<string, any> & { readonly children?: JSX.Node }
): JSX.Node;

export function jsxs(
  tag: string | Component,
  options: WithChildren<Record<string, any>>
): JSX.Node;

export { Fragment };
