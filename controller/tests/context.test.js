import { describe, test, expect } from "vitest";
import { Controller, Provide, Consume } from "@moru/controller";

import { render } from "./render.js";

describe("context", () => {
  test("provide should pass down value to consume", () => {
    @Controller()
    class ATestElement extends HTMLElement {
      @Provide()
      accessor foo = 2;
    }

    @Controller()
    class BTestElement extends HTMLElement {
      /**
       * @type {number}
       */
      @Consume()
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
    @Controller()
    class CTestElement extends HTMLElement {
      @Consume()
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
    @Controller()
    class ATest1Element extends HTMLElement {
      @Provide()
      accessor foo = 2;
    }

    @Controller()
    class BTest1Element extends HTMLElement {
      /**
       * @type {number}
       */
      @Consume()
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

  test("provider and consumer can use explicit key for context", () => {
    const key = "foobar";

    @Controller()
    class ATest2Element extends HTMLElement {
      @Provide(key)
      accessor foo = 2;
    }

    @Controller()
    class BTest2Element extends HTMLElement {
      /**
       * @type {number}
       */
      @Consume(key)
      // @ts-expect-error rule to allow non-initialised fields is not disabled
      accessor foo;
    }

    const container = render(`
      <a-test2>
        <b-test2 />
      </a-test2>
    `);

    const aTest2Element =
      /**
       * @type {ATest2Element}
       */
      (container.querySelector("a-test2"));
    const bTest2Element =
      /**
       * @type {BTest2Element}
       */
      (aTest2Element.querySelector("b-test2"));

    aTest2Element.foo = 4;

    expect(bTest2Element.foo).toBe(4);
  });
});
