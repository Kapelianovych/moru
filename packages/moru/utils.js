export const ensureArray = (value) => (Array.isArray(value) ? value : [value]);

export const ensureFunction = (value) =>
  typeof value === "function" ? value : () => value;
