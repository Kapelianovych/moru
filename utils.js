export const ensureFunction = (value) =>
  typeof value === "function" ? value : () => value;
