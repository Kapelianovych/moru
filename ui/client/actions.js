/**
 * @import { CustomElement } from "./controller.js";
 */

/**
 * @param {CustomElement} controller
 */
export function bindActions(controller) {
  if (controller.shadowRoot) {
    bindToChildrenOf(controller.shadowRoot);
    listenForNewActions(controller.shadowRoot);
  }

  bindToChildrenOf(controller);
  bindActionAttribute(controller);
  listenForNewActions(controller.ownerDocument);
}

/**
 * @param {ShadowRoot | Element} root
 */
function bindToChildrenOf(root) {
  for (const element of root.querySelectorAll("[data-actions]")) {
    bindActionAttribute(element);
  }
}

/**
 * @param {Element} element
 */
function bindActionAttribute(element) {
  /**
   * @type {WeakMap<Element, Set<string>>}
   */
  const boundElements =
    // @ts-expect-error TS does not know about this custom property
    (element.ownerDocument.$boundElements ??= new WeakMap());

  let boundEvents = boundElements.get(element);

  if (!boundEvents) {
    boundEvents = new Set();
    boundElements.set(element, boundEvents);
  }

  for (const binding of bindingsOf(element)) {
    if (!boundEvents.has(binding.type)) {
      boundEvents.add(binding.type);

      element.addEventListener(binding.type, handleEvent);
    }
  }
}

/**
 * @param {Event} event
 */
function handleEvent(event) {
  const element =
    /**
     * @type {Element}
     */
    (event.currentTarget);

  for (const binding of bindingsOf(element)) {
    if (binding.type === event.type) {
      let controller = element.closest(binding.tag);

      if (!controller) {
        const root = element.getRootNode();

        if (root instanceof ShadowRoot && root.host.matches(binding.tag)) {
          controller = root.host;
        }
      }

      // @ts-expect-error because of no explicit method definition
      controller[binding.method](event);
    }
  }
}

/**
 * @typedef {Object} Binding
 * @property {string} tag
 * @property {string} type
 * @property {string} method
 */

/**
 * @param {Element} element
 * @returns {Iterable<Binding>}
 */
function* bindingsOf(element) {
  if (element.hasAttribute("data-actions")) {
    // @ts-expect-error we made sure attribute exists
    const actions = element.getAttribute("data-actions").trim().split(/\s+/);

    for (const action of actions) {
      const eventSeparator = action.indexOf(":");
      const methodSeparator = Math.max(0, action.indexOf("#")) || action.length;

      yield {
        tag: action.slice(eventSeparator + 1, methodSeparator),
        type: action.slice(0, eventSeparator),
        method: action.slice(methodSeparator + 1) || "handleEvent",
      };
    }
  }
}

/**
 * @typedef {Object} ObserverSubscription
 * @property {boolean} disconnected
 * @property {VoidFunction} disconnect
 */

/**
 * @param {ShadowRoot | Document} root
 * @returns {ObserverSubscription}
 */
function listenForNewActions(root) {
  const ownerDocument = root.ownerDocument ?? root;

  /**
   * @type {WeakMap<ShadowRoot | Document, ObserverSubscription>}
   */
  const observerSubscriptions =
    // @ts-expect-error TS does not know about this custom property
    (ownerDocument.$observerSubscriptions ??= new WeakMap());

  let observerSubscription = observerSubscriptions.get(root);

  if (observerSubscription) {
    return observerSubscription;
  }

  let disconnected = false;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const target =
          /**
           * @type {Element}
           */
          (mutation.target);

        bindActionAttribute(target);
      } else if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            bindToChildrenOf(node);
            bindActionAttribute(node);
          }
        }
      }
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributeFilter: ["data-actions"],
  });

  observerSubscription = {
    get disconnected() {
      return disconnected;
    },
    disconnect() {
      disconnected = true;
      observerSubscriptions.delete(root);
      observer.disconnect();
    },
  };

  observerSubscriptions.set(root, observerSubscription);

  return observerSubscription;
}
