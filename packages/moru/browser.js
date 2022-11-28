import { runInContext } from "./state.js";
import { ensureArray, ensureFunction } from "./utils.js";
import {
  SVG_ELEMENTS,
  SVG_NAMESPACE,
  AttributesToProperties,
} from "./constants.js";

const clearNode = (node) =>
  node instanceof DocumentFragment
    ? node.__nodes.forEach(clearNode)
    : node.remove();

const createNodeInjector = (to, lastChild) => (child) => {
  if (typeof child === "function") {
    const emptyNode = document.createTextNode("");
    to.append(emptyNode);

    runInContext(() => createNodeInjector(to, emptyNode)(child()));
  } else if (Array.isArray(child))
    return createNodeInjector(to, lastChild)(Fragment({ children: child }));
  else {
    const next =
      child instanceof Node ? child : document.createTextNode(child ?? "");

    if (next instanceof DocumentFragment && !next.__nodes)
      Object.assign(next, {
        __nodes: Array.from(next.childNodes),
      });

    if (to instanceof DocumentFragment) to.__nodes.push(next);

    lastChild ? lastChild.after(next) : to.append(next);

    return () => clearNode(next);
  }
};

const endsAt = (once, capture, passive, noPassive) =>
  0 +
  (once ? -4 : 0) +
  (capture ? -7 : 0) +
  (noPassive ? -9 : passive ? -7 : 0);

const objectWith = (property, value) => (value ? { [property]: value } : {});

const assignAttribute = (element, key, value, asProperties = []) => {
  if (key.startsWith("on")) {
    const name = key.toLowerCase();

    const once = name.includes("once");
    const capture = name.includes("capture");
    const passive = name.includes("passive");
    const noPassive = name.includes("nopassive");

    element.addEventListener(
      name.slice(2, endsAt(once, capture, passive, noPassive) || name.length),
      value,
      {
        ...objectWith("once", once),
        ...objectWith("capture", capture),
        ...objectWith("passive", noPassive ? false : passive),
      }
    );
  } else if (key === "style" && typeof value === "object")
    Object.entries(value ?? {}).forEach(([key, value]) => {
      const get = ensureFunction(value);

      runInContext(() => element.style.setProperty(key, get()));
    });
  else if (key === "class" && Array.isArray(value))
    value.forEach((name) =>
      typeof name === "string"
        ? element.classList.add(name)
        : Object.entries(name).forEach(([key, value]) => {
            const get = ensureFunction(value);

            runInContext(() =>
              element.classList[get() ? "add" : "remove"](key)
            );
          })
    );
  else if (asProperties.includes(key)) {
    const get = ensureFunction(value);

    runInContext(() => (element[key] = get()));
  } else {
    const get = ensureFunction(value);

    runInContext(() => {
      const result = get();

      typeof result === "boolean"
        ? result
          ? element.setAttribute(key, "")
          : element.removeAttribute(key)
        : element.setAttribute(key, result);
    });
  }
};

export const element = (tag, { ref, children, ...attributes } = {}) => {
  if (typeof tag === "string") {
    const node = SVG_ELEMENTS.has(tag)
      ? document.createElementNS(SVG_NAMESPACE, tag)
      : document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) =>
      assignAttribute(node, key, value, AttributesToProperties[tag])
    );

    ensureArray(children).forEach(createNodeInjector(node));

    ref && ref(node);

    return node;
  }

  return tag({ ref, children, ...attributes });
};

export { element as jsx, element as jsxs, element as jsxDEV };

export const Fragment = ({ children }) => {
  const fragment = Object.assign(document.createDocumentFragment(), {
    __nodes: [],
  });

  ensureArray(children).forEach(createNodeInjector(fragment));

  return fragment;
};
