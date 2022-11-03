import { ensureFunction } from "./utils.js";
import { SelfClosedElements } from "./constants.js";

const camelCaseToKebabCase = (name) =>
  name
    .split("")
    .map((letter) =>
      letter === letter.toUpperCase() ? `-${letter.toLowerCase()}` : letter
    )
    .join("");

export const element = (tag, properties, ...children) => {
  const { ref, ...elementProperties } = properties ?? {};

  if (typeof tag === "string") {
    const attributes = Object.entries(elementProperties)
      .filter(([key]) => !key.startsWith("on"))
      .map(([key, value]) => {
        let attributeValue = "";

        if (key === "class" && Array.isArray(value))
          attributeValue = value
            .map((name) =>
              typeof name === "string"
                ? name
                : Object.entries(name)
                    .map(([key, value]) => (ensureFunction(value)() ? key : ""))
                    .filter(Boolean)
                    .join(" ")
            )
            .join(" ");
        else if (key === "style" && typeof value === "object")
          attributeValue = Object.entries(value ?? {}).map(
            ([key, value]) =>
              camelCaseToKebabCase(key) + ":" + ensureFunction(value)() + ";"
          );
        else attributeValue = String(ensureFunction(value)());

        return `${key}="${attributeValue}"`;
      })
      .join(" ");

    return SelfClosedElements.has(tag)
      ? `<${tag} ${attributes}>`
      : `<${tag} ${attributes}>${children.join("")}</${tag}>`;
  }

  return tag({ ref, children, ...elementProperties });
};

export const Fragment = ({ children }) => children.join("");
