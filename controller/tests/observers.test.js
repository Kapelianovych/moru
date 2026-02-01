import { controller, observe } from "@moru/controller";
import { vi, describe, expect, test } from "vitest";

import { render } from "./render.js";

class Store {
  #value = 0;
  #subscribers = new Set();

  get value() {
    return this.#value;
  }

  set value(value) {
    this.#value = value;
    this.#subscribers.forEach((callback) => {
      callback(value);
    });
  }

  /**
   * @param {function(number): void} callback
   * @returns {VoidFunction}
   */
  subscribe(callback) {
    this.#subscribers.add(callback);

    return () => {
      this.#subscribers.delete(callback);
    };
  }
}

describe("observers", () => {
  test("observe subscribes to subscription function when element is mounted", () => {
    const fn = vi.fn();

    @controller
    class ObserverTestElement extends HTMLElement {
      @observe(fn)
      foo() {}
    }

    const container = render("");

    const observerTestElement = document.createElement("observer-test");

    expect(fn).not.toHaveBeenCalledOnce();
    container.append(observerTestElement);
    expect(fn).toHaveBeenCalledOnce();
  });

  test("subscriber method is running when notifier is updated", () => {
    const fn = vi.fn();
    const store = new Store();

    @controller
    class ObserverTest1Element extends HTMLElement {
      /**
       * @param {number} value
       */
      @observe((consume) => {
        return store.subscribe(consume);
      })
      foo(value) {
        fn(value);
      }
    }

    render(`
      <observer-test1 />
    `);

    store.value = 1;

    expect(fn).toHaveBeenCalledExactlyOnceWith(1);
  });

  test("notifier object can be observed", () => {
    const fn = vi.fn();
    const store = new Store();

    @controller
    class ObserverTest2Element extends HTMLElement {
      /**
       * @param {number} value
       */
      @observe(store)
      foo(value) {
        fn(value);
      }
    }

    render(`
      <observer-test2 />
    `);

    store.value = 1;

    expect(fn).toHaveBeenCalledExactlyOnceWith(1);
  });

  test("element unsubscribes when it is disconnected from DOM", () => {
    const fn = vi.fn();
    const store = new Store();

    @controller
    class ObserverTest2Element extends HTMLElement {
      /**
       * @param {number} value
       */
      @observe(store)
      foo(value) {
        fn(value);
      }
    }

    const container = render(`
      <observer-test2 />
    `);

    container.firstElementChild?.remove();

    store.value = 1;

    expect(fn).not.toHaveBeenCalled();
  });

  test("element resubscribes when it is connected to DOM again", () => {
    const fn = vi.fn();
    const store = new Store();

    @controller
    class ObserverTest3Element extends HTMLElement {
      /**
       * @param {number} value
       */
      @observe(store)
      foo(value) {
        fn(value);
      }
    }

    const container = render(`
      <observer-test3 />
    `);

    const observerTestElement =
      /**
       * @type {ObserverTest3Element}
       */
      (container.firstElementChild);

    container.removeChild(observerTestElement);
    container.append(observerTestElement);

    store.value = 1;

    expect(fn).toHaveBeenCalledOnce();
  });
});
