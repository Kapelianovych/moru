import { isFunction } from "./utils.js";
import { isJSXCoreElement } from "./core.js";
import { SelfClosedElements } from "./constants.js";

export const isServer = true,
  isBrowser = false,
  isHydrationEnabled = import.meta.env.MORU_IS_HYDRATION_ENABLED;

let hydrationId = 0;

const createElement = ({ tag, ref, children, attributes }) => {
  if (typeof tag === "string") {
    let shouldHydrate = !!ref;

    const elementMarker = isHydrationEnabled && `data-he="${hydrationId++}"`;

    const tagsAttributes = Object.entries(attributes)
      .map(([key, value]) => {
        if (key.startsWith("on")) {
          isHydrationEnabled && (shouldHydrate = true);
          return;
        }

        let attributeValue = "";

        if (key === "class" && Array.isArray(value))
          attributeValue = value
            .flatMap((name) =>
              typeof name === "string"
                ? name
                : Object.entries(name)
                    .map(([key, value]) => {
                      const isFn = isFunction(value);

                      isHydrationEnabled && (shouldHydrate ||= isFn);

                      return (isFn ? value() : value) ? key : "";
                    })
                    .filter(Boolean)
            )
            .join(" ");
        else if (key === "style" && typeof value === "object")
          attributeValue = Object.entries(value ?? {})
            .map(([key, value]) => {
              const isFn = isFunction(value);

              isHydrationEnabled && (shouldHydrate ||= isFn);

              return `${key}:${isFn ? value() : value};`;
            })
            .join("");
        else {
          const isFn = isFunction(value);

          isHydrationEnabled && (shouldHydrate ||= isFn);

          const result = isFn ? value() : value;

          if (typeof result === "boolean") return result ? key : "";

          attributeValue = result;
        }

        return `${key}="${attributeValue}"`;
      })
      .filter(Boolean)
      .join(" ");

    let halfElement = `<${tag}${tagsAttributes && ` ${tagsAttributes}`}>`;

    if (isHydrationEnabled)
      shouldHydrate
        ? (halfElement = halfElement.slice(0, -1) + ` ${elementMarker}>`)
        : hydrationId--;

    return SelfClosedElements.has(tag)
      ? halfElement
      : `${halfElement}${render(children)}</${tag}>`;
  }

  return tag({ ref, children, ...attributes });
};

const renderToString = (element) => {
  if (element == null) return "";

  if (isJSXCoreElement(element))
    return element.tag === "fragment"
      ? render(element.children)
      : render(createElement(element));

  if (isFunction(element)) {
    if (!isHydrationEnabled) return render(element());

    const tag = hydrationId++;

    return `<!--${tag}/-->${render(element())}<!--/${tag}-->`;
  }

  return Array.isArray(element)
    ? element.map(render).join("")
    : String(element);
};

export const render = (element) => {
  const html = renderToString(element);

  hydrationId = 0;

  return html;
};
