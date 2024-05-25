const ELEMENT = Symbol("moru:element");

export const isElement = (value) => !!value?.[ELEMENT];

export const createElement = (tag, properties) =>
  tag === Fragment
    ? properties.children
    : { tag, properties, [ELEMENT]: ELEMENT };

export const Fragment = Symbol("moru:fragment");

export { createElement as jsx, createElement as jsxs, createElement as jsxDEV };
