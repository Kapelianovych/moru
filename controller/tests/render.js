/**
 * @param {string} html
 * @returns {HTMLDivElement}
 */
export function render(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  document.body.append(div);
  return div;
}
