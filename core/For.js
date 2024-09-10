import { jsx } from "./jsx.js";
import { isDev } from "./environment.js";
import { state } from "./state.js";
import { controller } from "./controller.js";
import { view, property } from "./view.js";

@state()
class ForState {}

@controller()
class ForController {
  @state(ForState) #state;

  #cachedNodes = [];
  #remappedKeys = new Map();
  #previousKeys = new Map();

  reconcile(items, getKey, getView, fallback) {
    const nextKeys = new Map();
    const mappedNodes = new Array(items.length);
    const indexesToWalk = new Set();

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const itemKey = this.#createKey(nextKeys, getKey(item), index);

      nextKeys.set(itemKey, index);
      nextKeys.set(index, itemKey);

      if (this.#previousKeys.has(itemKey)) {
        const previousIndex = this.#previousKeys.get(itemKey);
        const remappedItemKey = this.#remappedKeys.get(itemKey);

        this.#previousKeys.delete(itemKey);
        this.#previousKeys.delete(previousIndex);

        mappedNodes[index] = this.#cachedNodes[previousIndex];

        this.#state[this.#createStateKey(remappedItemKey ?? itemKey, "index")] =
          index;
      } else indexesToWalk.add(index);
    }

    for (const index of indexesToWalk) {
      const item = items[index];
      const itemKey = nextKeys.get(index);
      const previousItemKey = this.#previousKeys.get(index);

      if (index < this.#cachedNodes.length && previousItemKey) {
        const remappedKey = this.#remappedKeys.get(previousItemKey);

        this.#previousKeys.delete(previousItemKey);
        this.#previousKeys.delete(index);
        this.#remappedKeys.delete(previousItemKey);
        this.#remappedKeys.set(itemKey, remappedKey ?? previousItemKey);

        mappedNodes[index] = this.#cachedNodes[index];
        this.#state[
          this.#createStateKey(remappedKey ?? previousItemKey, "item")
        ] = item;
      } else {
        const itemStateProperty = this.#createStateKey(itemKey, "item");
        const indexStateProperty = this.#createStateKey(itemKey, "index");

        this.#state[itemStateProperty] = item;
        this.#state[indexStateProperty] = index;

        mappedNodes[index] = jsx(Cacheable, {
          children: getView(itemStateProperty, indexStateProperty),
        });
      }
    }

    this.#discardUnusedNodes();

    this.#cachedNodes = mappedNodes;
    this.#previousKeys = nextKeys;

    return mappedNodes.length ? mappedNodes : fallback;
  }

  #discardUnusedNodes() {
    const { done, value } = this.#previousKeys.keys().next();

    // In a Map when iteration is completed, only `done` property is present.
    if (done) return;

    const index = Number.isFinite(value)
      ? value
      : this.#previousKeys.get(value);
    const itemKey = this.#previousKeys.get(index);
    const remappedKey = this.#remappedKeys.get(itemKey);

    const node = this.#cachedNodes[index];

    node.$cachedView.$disconnect(true);

    delete node.$cachedView;
    delete node.$cachedNode;

    delete this.#state[this.#createStateKey(remappedKey ?? itemKey, "item")];
    delete this.#state[this.#createStateKey(remappedKey ?? itemKey, "index")];

    this.#previousKeys.delete(index);
    this.#previousKeys.delete(itemKey);
    this.#remappedKeys.delete(itemKey);

    this.#discardUnusedNodes();
  }

  #createStateKey(key, kind) {
    return `${key}_${kind}`;
  }

  #createKey(storage, itemKey, index) {
    if (isDev && typeof itemKey !== "string" && typeof itemKey !== "number") {
      throw new Error(
        `For expects only "string" or "number" keys, but encountered an "${typeof itemKey}". ` +
          'Please, provide different "key" function.',
      );
    }

    if (Number.isFinite(itemKey))
      // Don't allow keys as numbers to avoid resetting some index.
      itemKey = String(itemKey);

    if (storage.has(itemKey)) {
      if (isDev) {
        console.warn(
          `A duplicate item with "${itemKey}" key at the ${index} index has been found.` +
            " The For component is less efficient with lists which contain items that produce same keys.",
        );
      }

      // Unfortunately, a duplicate key has been found.
      // Try to make the key unique.
      itemKey = String(itemKey) + index;
    }

    return itemKey;
  }
}

@view()
export class For {
  @state(ForState) #state;
  @controller(ForController) #controller;

  @property("key") #key = (item) => item;
  @property("each") #each;
  @property("fallback") #fallback;
  @property("children") #children;

  #getChildView = (itemKey, indexKey) =>
    this.#children(this.#state[itemKey], this.#state[indexKey]);

  view() {
    return this.#each.map((items) =>
      this.#controller.reconcile(
        items,
        this.#key,
        this.#getChildView,
        this.#fallback,
      ),
    );
  }
}

@view({ cacheable: true })
class Cacheable {
  @property("children") #children;

  view() {
    return this.#children;
  }
}
