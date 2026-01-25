import { attribute, controller } from "@moru/controller";
import { describe, expect, test } from "vitest";

import { render } from "./render.js";

describe("attributes", () => {
  test("explicitly defined attribute value should be set to a bound property", () => {
    @controller
    class AttributeTestElement extends HTMLElement {
      @attribute accessor foo = "1";
    }

    const container = render(`
      <attribute-test foo="2" />
    `);

    const element =
      /**
       * @type {AttributeTestElement}
       */
      (container.querySelector("attribute-test"));

    expect(element.foo).toBe("2");
  });

  test("default property value should define attribute value if the latter is not defined", () => {
    @controller
    class AttributeTest2Element extends HTMLElement {
      @attribute accessor foo = "1";
    }

    const container = render(`
      <attribute-test2 />
    `);

    const element =
      /**
       * @type {AttributeTest2Element}
       */
      (container.querySelector("attribute-test2"));

    expect(element.getAttribute("foo")).toBe("1");
  });

  test("boolean property should add/remove attribute", () => {
    @controller
    class AttributeTest3Element extends HTMLElement {
      @attribute accessor foo = true;
    }

    const container = render(`
      <attribute-test3 />
    `);

    const element =
      /**
       * @type {AttributeTest3Element}
       */
      (container.querySelector("attribute-test3"));

    expect(element.hasAttribute("foo")).toBe(true);
    expect(element.getAttribute("foo")).toBe("");

    element.foo = false;

    expect(element.hasAttribute("foo")).toBe(false);
  });

  test("numeric property should convert attribute's value into number", () => {
    @controller
    class AttributeTest4Element extends HTMLElement {
      @attribute accessor foo = 1;
    }

    const container = render(`
      <attribute-test4 foo="2" />
    `);

    const element =
      /**
       * @type {AttributeTest4Element}
       */
      (container.querySelector("attribute-test4"));

    expect(element.foo).toBe(2);
  });

  test("change of the property should update the attribute value", () => {
    @controller
    class AttributeTest5Element extends HTMLElement {
      @attribute accessor foo = 1;
    }

    const container = render(`
      <attribute-test5 foo="1" />
    `);

    const element =
      /**
       * @type {AttributeTest5Element}
       */
      (container.querySelector("attribute-test5"));

    element.foo = 5;

    expect(element.getAttribute("foo")).toBe("5");
  });

  test("change of the attribute should update the property value", () => {
    @controller
    class AttributeTest6Element extends HTMLElement {
      @attribute accessor foo = 1;
    }

    const container = render(`
      <attribute-test6 foo="1" />
    `);

    const element =
      /**
       * @type {AttributeTest6Element}
       */
      (container.querySelector("attribute-test6"));

    element.setAttribute("foo", "3");

    expect(element.foo).toBe(3);
  });
});
