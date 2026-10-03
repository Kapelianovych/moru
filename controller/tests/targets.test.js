import { Controller, Target } from "@moru/controller";
import { describe, expect, test } from "vitest";

import { render } from "./render.js";

describe("targets", () => {
  test("target allows to obtain a reference to the element", () => {
    @Controller()
    class TargetTestElement extends HTMLElement {
      /**
       * @type {HTMLDivElement}
       */
      // @ts-expect-error property will be dynamically initialised.
      @Target() accessor div;
    }

    const container = render(`
      <target-test>
        <div data-target="target-test.div"></div>
      </target-test>
    `);

    const targetTestElement =
      /**
       * @type {TargetTestElement}
       */
      (container.firstElementChild);

    expect(targetTestElement.div).toBe(targetTestElement.firstElementChild);
  });

  test("target decorator can be applied to the private property", () => {
    @Controller()
    class TargetTest1Element extends HTMLElement {
      /**
       * @type {HTMLDivElement}
       */
      // @ts-expect-error property will be dynamically initialised.
      @Target() accessor #div;

      get div() {
        return this.#div;
      }
    }

    const container = render(`
      <target-test1>
        <div data-target="target-test1.div"></div>
      </target-test1>
    `);

    const targetTestElement =
      /**
       * @type {TargetTest1Element}
       */
      (container.firstElementChild);

    expect(targetTestElement.div).toBe(targetTestElement.firstElementChild);
  });

  test("target always resolve to the element present in DOM", () => {
    @Controller()
    class TargetTest2Element extends HTMLElement {
      /**
       * @type {HTMLDivElement}
       */
      // @ts-expect-error property will be dynamically initialised.
      @Target() accessor div;
    }

    const container = render(`
      <target-test2>
        <div data-target="target-test2.div"></div>
      </target-test2>
    `);

    const targetTestElement =
      /**
       * @type {TargetTest2Element}
       */
      (container.firstElementChild);

    const button = document.createElement("button");
    button.setAttribute("data-target", "target-test2.div");

    targetTestElement.firstElementChild?.replaceWith(button);

    expect(targetTestElement.div).toBe(button);
  });

  test("target finds first element only", () => {
    @Controller()
    class TargetTest3Element extends HTMLElement {
      /**
       * @type {HTMLDivElement}
       */
      // @ts-expect-error property will be dynamically initialised.
      @Target() accessor div;
    }

    const container = render(`
      <target-test3>
        <div data-target="target-test3.div"></div>
        <button data-target="target-test3.div"></button>
      </target-test3>
    `);

    const targetTestElement =
      /**
       * @type {TargetTest3Element}
       */
      (container.firstElementChild);

    expect(targetTestElement.div).toBe(targetTestElement.firstElementChild);
  });

  test("targets find all elements", () => {
    @Controller()
    class TargetTest4Element extends HTMLElement {
      /**
       * @type {Array<HTMLElement>}
       */
      // @ts-expect-error property will be dynamically initialised.
      @Target({ all: true }) accessor els;
    }

    const container = render(`
      <target-test4>
        <div data-target="target-test4.els"></div>
        <button data-target="target-test4.els"></button>
      </target-test4>
    `);

    const targetTestElement =
      /**
       * @type {TargetTest4Element}
       */
      (container.firstElementChild);

    expect(targetTestElement.els).toMatchObject([
      targetTestElement.firstElementChild,
      targetTestElement.firstElementChild?.nextElementSibling,
    ]);
  });

  test("when there are not matching elements, targets resolved to the empty array", () => {
    @Controller()
    class TargetTest5Element extends HTMLElement {
      /**
       * @type {Array<HTMLElement>}
       */
      // @ts-expect-error property will be dynamically initialised.
      @Target({ all: true }) accessor els;
    }

    const container = render(`
      <target-test5></target-test5>
    `);

    const targetTestElement =
      /**
       * @type {TargetTest5Element}
       */
      (container.firstElementChild);

    expect(targetTestElement.els).toMatchObject([]);
  });

  test("explicit name is used to locate target instead of property's name", () => {
    @Controller()
    class TargetTest6Element extends HTMLElement {
      /**
       * @type {HTMLElement}
       */
      // @ts-expect-error property will be dynamically initialised.
      @Target({ name: "foo" }) accessor els;
    }

    const container = render(`
      <target-test6>
        <div data-target="target-test6.foo"></div>
      </target-test6>
    `);

    const targetTestElement =
      /**
       * @type {TargetTest6Element}
       */
      (container.firstElementChild);

    expect(targetTestElement.els).toBe(targetTestElement.firstElementChild);
  });
});
