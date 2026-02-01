import { vi, describe, expect, test } from "vitest";
import { controller, watch, property, attribute } from "@moru/controller";

import { render } from "./render.js";

describe("watch", () => {
  test("watch calls the method when attribute has been changed", () => {
    const fn = vi.fn();

    @controller
    class WatchTestElement extends HTMLElement {
      @attribute accessor foo = "";

      @watch("foo") on = fn;
    }

    const container = render(`
      <watch-test></watch-test>
    `);

    expect(fn).not.toHaveBeenCalledOnce();

    container.firstElementChild?.setAttribute("foo", "1");

    expect(fn).toHaveBeenCalledOnce();
  });

  test("watch can be stacked", () => {
    const fn = vi.fn();

    @controller
    class WatchTest1Element extends HTMLElement {
      @attribute accessor foo = "";
      @attribute accessor bar = "";

      @watch("foo")
      @watch("bar")
      on = fn;
    }

    const container = render(`
      <watch-test1></watch-test1>
    `);

    container.firstElementChild?.setAttribute("foo", "1");
    container.firstElementChild?.setAttribute("bar", "1");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("watch can track properties", () => {
    const fn = vi.fn();

    @controller
    class WatchTest2Element extends HTMLElement {
      @property accessor foo = 0;

      @watch("foo") on = fn;
    }

    const container = render(`
      <watch-test2></watch-test2>
    `);

    const watchTestElement =
      /**
       * @type {WatchTest2Element}
       */
      (container.firstElementChild);

    watchTestElement.foo = 1;

    expect(fn).toHaveBeenCalledOnce();
  });

  test("watch can track private fields", () => {
    const fn = vi.fn();

    @controller
    class WatchTest3Element extends HTMLElement {
      @property accessor #foo = 0;
      @attribute accessor #bar = "";

      @watch("#foo")
      @watch("#bar")
      on = fn;

      /**
       * @param {number} value
       */
      set foo(value) {
        this.#foo = value;
      }
    }

    const container = render(`
      <watch-test3></watch-test3>
    `);

    const watchTestElement =
      /**
       * @type {WatchTest3Element}
       */
      (container.firstElementChild);

    watchTestElement.foo = 1;
    watchTestElement.setAttribute("bar", "1");

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
