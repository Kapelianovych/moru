import { Component, Fragment, WithChildren } from "./index.js";

export function jsx(
  tag: string | Component,
  options: Record<string, any> & { readonly children?: JSX.Element }
): JSX.Element;

export function jsxs(
  tag: string | Component,
  options: WithChildren<Record<string, any>>
): JSX.Element;

export { Fragment };
