import { toKebabCase } from "./to-kebab-case.js";

/**
 * @param {string | symbol} name
 * @returns {string}
 */
export function createName(name) {
  const rawName = String(name);
  const isPrivate = rawName.startsWith("#");
  return toKebabCase(isPrivate ? rawName.slice(1) : rawName);
}
