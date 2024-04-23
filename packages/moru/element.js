const ELEMENT = Symbol("moru:element");

export const isElement = (value) =>
  value && typeof value === "object" && ELEMENT in value;

export const createElement = (tag, properties) =>
  tag === Fragment
    ? properties.children
    : {
        tag,
        properties,
        [ELEMENT]: null,
      };

export const Fragment = Symbol("moru:fragment");

export { createElement as jsx, createElement as jsxs, createElement as jsxDEV };
