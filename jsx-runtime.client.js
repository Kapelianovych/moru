import createRuntime from './runtime.js';
import { element, Fragment } from "./index.client.js";

const runtime = createRuntime(element);

export { Fragment, runtime as jsx, runtime as jsxs };
