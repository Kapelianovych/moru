export default (element) => (tag, { children, ...props }) =>
  element(tag, props, ...(Array.isArray(children) ? children : [children]));