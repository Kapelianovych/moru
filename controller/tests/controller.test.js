import { controller } from "@moru/controller";
import { test, expect, describe } from "vitest";

describe("controller", () => {
  test("should register new custom web component", async () => {
    @controller
    class ForTestElement extends HTMLElement {}

    expect(customElements.get("for-test") != null).toBe(true);
    expect(
      // @ts-expect-error we did not declare ForTestElement property on Window
      window.ForTestElement,
    ).toBe(ForTestElement);
  });
});
