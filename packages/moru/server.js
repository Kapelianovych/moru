import { ensureFunction } from "./utils.js";
import { SelfClosedElements } from "./constants.js";

const renderChildren = (elements) => {
  if (typeof elements === "function") return renderChildren(elements());
  else if (Array.isArray(elements))
    return elements.map(renderChildren).join("");
  return elements ?? "";
};

export const element = (tag, { ref, children, ...attributes } = {}) => {
  if (typeof tag === "string") {
    const tagsAttributes = Object.entries(attributes)
      .filter(([key]) => !key.startsWith("on"))
      .map(([key, value]) => {
        let attributeValue = "";

        if (key === "class" && Array.isArray(value))
          attributeValue = value
            .flatMap((name) =>
              typeof name === "string"
                ? name
                : Object.entries(name)
                    .map(([key, value]) => (ensureFunction(value)() ? key : ""))
                    .filter(Boolean)
            )
            .join(" ");
        else if (key === "style" && typeof value === "object")
          attributeValue = Object.entries(value ?? {}).map(
            ([key, value]) => key + ":" + ensureFunction(value)() + ";"
          );
        else {
          const result = ensureFunction(value)();

          if (typeof result === "boolean") {
            return result ? key : "";
          }

          attributeValue = result;
        }

        return `${key}="${attributeValue}"`;
      })
      .join(" ");

    return SelfClosedElements.has(tag)
      ? `<${tag} ${tagsAttributes}>`
      : `<${tag} ${tagsAttributes}>${renderChildren(children)}</${tag}>`;
  }

  return tag({ ref, children, ...attributes });
};

export { element as jsx, element as jsxs, element as jsxDEV };

export const Fragment = ({ children }) => renderChildren(children);
