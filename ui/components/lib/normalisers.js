/**
 * @param {string | boolean | null | undefined} value
 * @returns {string | undefined}
 */
export function normaliseBooleanProperty(value) {
  return value != null && value ? "" : undefined;
}
