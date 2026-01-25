import { describe, test, expect } from "vitest";
import { controller, provide, consume } from "@moru/controller";

import { render } from "./render.js";

describe("context", () => {
  test("provide should pass down value to consume", () => {
    @controller
    class ATestElement extends HTMLElement {
      @provide
      accessor foo = 2;
    }

    @controller
    class BTestElement extends HTMLElement {
      /**
       * @type {number}
       */
      @consume
      // @ts-expect-error rule to allow non-initialised fields is not disabled
      accessor foo;
    }

    const container = render(`
      <a-test>
        <b-test />
      </a-test>
    `);

    const bTestElement =
      /**
       * @type {BTestElement}
       */
      (container.querySelector("b-test"));

    expect(bTestElement.foo).toBe(2);
  });

  test("consume called outside of the provider uses the default value", () => {
    @controller
    class CTestElement extends HTMLElement {
      @consume
      accessor foo = 4;
    }

    const container = render("<c-test />");

    const cTestElement =
      /**
       * @type {CTestElement}
       */
      (container.querySelector("c-test"));

    expect(cTestElement.foo).toBe(4);
  });

  test("changes to the provided value update also the consumer", () => {
    @controller
    class ATest1Element extends HTMLElement {
      @provide
      accessor foo = 2;
    }

    @controller
    class BTest1Element extends HTMLElement {
      /**
       * @type {number}
       */
      @consume
      // @ts-expect-error rule to allow non-initialised fields is not disabled
      accessor foo;
    }

    const container = render(`
      <a-test1>
        <b-test1 />
      </a-test1>
    `);

    const aTest1Element =
      /**
       * @type {ATest1Element}
       */
      (container.querySelector("a-test1"));
    const bTest1Element =
      /**
       * @type {BTest1Element}
       */
      (aTest1Element.querySelector("b-test1"));

    aTest1Element.foo = 4;

    expect(bTest1Element.foo).toBe(4);
  });
});
