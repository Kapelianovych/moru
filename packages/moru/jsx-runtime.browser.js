import createRuntime from "./runtime.js";
import { element, Fragment } from "./index.browser.js";

const runtime = createRuntime(element);

export { Fragment, runtime as jsx, runtime as jsxs };
