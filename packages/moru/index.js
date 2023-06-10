const ELEMENT = Symbol("moru:element");

export const isElement = (value) =>
    value && typeof value === "object" && ELEMENT in value,
  createElement = (tag, properties) =>
    tag === Fragment
      ? properties.children
      : {
          tag,
          properties,
          [ELEMENT]: null,
        },
  Fragment = Symbol("moru:fragment"),
  jsx = createElement,
  jsxs = createElement,
  jsxDEV = createElement;
