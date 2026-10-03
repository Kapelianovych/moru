import { Controller } from "@moru/controller";
import { test, expect, describe } from "vitest";

describe("controller", () => {
  test("should register new custom web component", async () => {
    @Controller()
    class ForTestElement extends HTMLElement {}

    expect(customElements.get("for-test") != null).toBe(true);
    expect(
      // @ts-expect-error we did not declare ForTestElement property on Window
      window.ForTestElement,
    ).toBe(ForTestElement);
  });

  test("can accept element tag explicitly", async () => {
    @Controller({ tag: "foo-bar" })
    class ForTest2Element extends HTMLElement {}

    expect(customElements.get("foo-bar") != null).toBe(true);
    expect(customElements.get("for-test2") == null).toBe(true);
    expect(
      // @ts-expect-error we did not declare ForTestElement property on Window
      window.ForTest2Element,
    ).toBe(ForTest2Element);
  });
});
