export default (element) =>
  (tag, { children, ...properties }) =>
    element(
      tag,
      properties,
      ...(Array.isArray(children) ? children : [children])
    );

