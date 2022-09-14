import { element, Fragment } from "./index.js";

const runtime = (tag, { children, ...props }) =>
  element(tag, props, ...(Array.isArray(children) ? children : [children]));

export { Fragment, runtime as jsx, runtime as jsxs };
