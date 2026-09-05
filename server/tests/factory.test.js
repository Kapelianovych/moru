/**
 * @import { SessionResponse } from "../source/index.js";
 */

import { describe, expect, it, test } from "vitest";

import { factory, Guard, TryNext } from "../source/index.js";

describe("factory", () => {
  it("should return a new class", () => {
    class A {}
    const B = factory(A, []);

    expect(A).not.toBe(B);
    expect(B).toBeTypeOf("function");
  });

  test("new class should return an instance of original class", () => {
    class A {}
    const B = factory(A, []);

    expect(new B()).toBeInstanceOf(A);
  });

  it("should bind arguments to original class constructor parameters", () => {
    class A {
      /**
       * @param {number} foo
       */
      constructor(foo) {
        this.foo = foo;
      }
    }
    const B = factory(A, [1]);
    const bInstance = new B();

    expect(bInstance.foo).toBe(1);
  });

  test("should correctly detect guard constructor", () => {
    @Guard()
    class A {
      /**
       * @param {number} foo
       */
      constructor(foo) {
        this.foo = foo;
      }
      /**
       * @param {Error} error
       * @return {SessionResponse}
       */
      catch(error) {
        return TryNext;
      }
    }

    const B = factory(A, [1]);
    const bInstance = new B();

    expect(bInstance.foo).toBe(1);
  });
});
