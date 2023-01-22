const ElementTag = Symbol("JSXCore.Element");

export const isJSXCoreElement = (value) =>
    value && typeof value === "object" && ElementTag in value,
  createElement = (tag, { ref, children, ...attributes }) =>
    tag === Fragment
      ? tag(children)
      : {
          tag,
          ref,
          children,
          attributes,
          [ElementTag]: null,
        },
  Fragment = (children) => ({
    tag: "fragment",
    children,
    [ElementTag]: null,
  });
