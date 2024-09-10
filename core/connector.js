import { isJSX } from "./jsx.js";
import { Consumer } from "./consumer.js";
import { immediately } from "./scheduler.js";
import { DefaultView } from "./view.js";
import { Environment, isDev } from "./environment.js";

class Renderer {
  #environment;

  #createNode;
  #appendNode;
  #removeNode;
  #setProperty;
  #insertNodeAfter;
  #createDefaultNode;

  constructor(options, environment) {
    this.hydration = options.hydration;
    this.#environment = environment;

    this.#createNode = options.createNode;
    this.#appendNode = options.appendNode;
    this.#removeNode = options.removeNode;
    this.#setProperty = options.setProperty;
    this.#insertNodeAfter = options.insertNodeAfter;
    this.#createDefaultNode = options.createDefaultNode;
  }

  render(jsx, parentNode, parentView, position) {
    if (isJSX(jsx)) {
      return jsx.$tag.$view
        ? this.#renderView(jsx, parentNode, parentView, position)
        : this.#renderIntrinsic(jsx, parentNode, parentView, position);
    } else if (Array.isArray(jsx)) {
      return this.#renderArray(jsx, parentNode, parentView, position);
    } else if (jsx instanceof Consumer) {
      return this.#renderConsumer(jsx, parentNode, parentView, position);
    } else {
      return this.#renderDefault(jsx, parentNode, parentView, position);
    }
  }

  #renderView(jsx, parentNode, parentView, position) {
    if (jsx.$cachedView) {
      jsx.$cachedView.$parentView = parentView;
      parentView.$childViews.add(jsx.$cachedView);

      return jsx.$cachedNode;
    } else {
      const view = new jsx.$tag(this.#environment, parentView, jsx.$properties);

      parentView.$childViews.add(view);

      const node = this.render(view.view(), parentNode, view, position);

      if (jsx.$tag.$view.cacheable) {
        jsx.$cachedView = view;
        jsx.$cachedNode = node;
      }

      return node;
    }
  }

  #renderIntrinsic(jsx, parentNode, parentView, position) {
    const node = this.#createNode(
      parentNode,
      jsx.$tag,
      this.hydration,
      position,
    );

    for (const property in jsx.$properties) {
      if (property === "ref" || property === "children") continue;

      const value = jsx.$properties[property];

      if (value instanceof Consumer) {
        if (this.#environment.allowEffects) {
          value.run(
            (value) => {
              this.#setProperty(
                node,
                property,
                value,
                this.hydration,
                position,
              );
            },
            parentView,
            immediately,
          );
        } else
          this.#setProperty(node, property, value(), this.hydration, position);
      } else this.#setProperty(node, property, value, this.hydration, position);
    }

    this.append(
      this.render(jsx.$properties.children, node, parentView, 0),
      node,
      position,
    );

    if (this.#environment.allowEffects) {
      jsx.$properties.ref?.(node);
    }

    return node;
  }

  #renderArray(jsx, parentNode, parentView, position) {
    const nodes = jsx.flatMap((jsx, index) => {
      return this.render(jsx, parentNode, parentView, position + index);
    });

    return nodes.length
      ? nodes
      : this.#createDefaultNode(parentNode, null, this.hydration, position);
  }

  #renderConsumer(jsx, parentNode, parentView, position) {
    const marker = this.#createDefaultNode(
      parentNode,
      null,
      this.hydration,
      position,
    );

    const localPosition = position + 1;

    if (this.#environment.allowEffects) {
      let previousNode;
      let localParentView;

      jsx.run(
        (jsx) => {
          localParentView?.$disconnect();
          localParentView = new DefaultView(this.#environment, parentView, {});

          const node = this.render(
            jsx,
            parentNode,
            localParentView,
            localPosition,
          );

          if (previousNode) {
            this.#replace(
              marker,
              previousNode,
              node,
              parentNode,
              localParentView,
              localPosition,
            );
          }

          previousNode = node;
        },
        parentView,
        immediately,
      );

      return [marker, previousNode];
    } else {
      return [
        marker,
        this.render(jsx(), parentNode, parentView, localPosition),
      ];
    }
  }

  #renderDefault(jsx, parentNode, parentView, position) {
    return this.#createDefaultNode(parentNode, jsx, this.hydration, position);
  }

  append(node, parentNode, parentView, position) {
    if (Array.isArray(node)) {
      node.forEach((child, index) =>
        this.append(child, parentNode, parentView, position + index),
      );
    } else {
      this.#appendNode(parentNode, node, this.hydration, position);
    }
  }

  #replace(marker, previousNode, node, parentNode, parentView, position) {
    const nextSet = Array.isArray(node) ? new Set(node) : new Set([node]);

    if (Array.isArray(previousNode)) {
      previousNode.forEach((node, index) => {
        nextSet.has(node) ||
          this.remove(node, parentNode, parentView, position + index);
      });
    } else {
      nextSet.has(previousNode) ||
        this.remove(previousNode, parentNode, parentView, position);
    }

    this.#insertAfter(marker, node, parentNode, parentView, position);

    parentView.$connect();
  }

  remove(node, parentNode, parentView, position) {
    if (Array.isArray(node)) {
      node.forEach((child, index) =>
        this.remove(child, parentNode, parentView, position + index),
      );
    } else {
      this.#removeNode(parentNode, node, this.hydration, position);
    }
  }

  #insertAfter(marker, node, parentNode, parentView, position) {
    if (Array.isArray(node)) {
      let lastInsertedInstance = marker;

      node.forEach((node, index) => {
        this.#insertAfter(
          lastInsertedInstance,
          node,
          parentNode,
          parentView,
          position + index,
        );
        lastInsertedInstance = node;
      });
    } else {
      this.#insertNodeAfter(parentNode, marker, node, this.hydration, position);
    }
  }
}

export function connector(rendererOptions) {
  return (jsx, parentNode, connectOptions = {}) => {
    const environment = new Environment(rendererOptions.allowEffects);
    const renderer = new Renderer(rendererOptions, environment);
    const parentView = new DefaultView(environment, null, {});
    const position = connectOptions.position ?? 0;

    const node = renderer.render(jsx, parentNode, parentView, position);

    renderer.append(node, parentNode, parentView, position);

    if (environment.allowEffects) {
      parentView.$connect();
    }

    renderer.hydration = false;

    return () => {
      renderer.remove(node, parentNode, parentView, position);
      parentView.$disconnect(true);
      environment.destroy();
    };
  };
}

export function connected() {
  return (target, context) => {
    if (isDev && context.kind !== "method") {
      throw new Error(
        `@connected() can only register methods, but the target is ${context.name} (${context.kind}).`,
      );
    }

    context.addInitializer(function () {
      if (
        isDev &&
        !("$view" in this.constructor) &&
        !("$controller" in this.constructor)
      ) {
        throw new Error(
          "@connected() can be used only inside classes marked as @view() or @controller(), " +
            `but the ${this.constructor.name} is not.`,
        );
      }

      this.$ensurePropertiesAreInitialised();

      this.$connectedCallbacks.push(target);
    });
  };
}

export function disconnected() {
  return (target, context) => {
    if (isDev && context.kind !== "method") {
      throw new Error(
        `@disconnected() can only register methods, but the target is ${context.name} (${context.kind}).`,
      );
    }

    context.addInitializer(function () {
      if (
        isDev &&
        !("$view" in this.constructor) &&
        !("$controller" in this.constructor)
      ) {
        throw new Error(
          "@disconnected() can be used only inside classes marked as @view() or @controller(), " +
            `but the ${this.constructor.name} is not.`,
        );
      }

      this.$ensurePropertiesAreInitialised();

      this.$disconnectedCallbacks.push(target);
    });
  };
}
