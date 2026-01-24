import { bound } from "@moru/controller";
import { describe, expect, test } from "vitest";

describe("bound", () => {
  test("should bind this to a method", () => {
    class A {
      #n = 7;

      @bound
      foo() {
        return this.#n;
      }
    }

    const { foo } = new A();

    expect(foo()).toBe(7);
  });
});
