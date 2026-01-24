import { controller } from "@moru/controller";
import { page, userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";

describe("actions", () => {
  test("action should be bound by the matching controller", async () => {
    const fn = vi.fn();

    @controller
    class ForTestElement extends HTMLElement {
      hello() {
        fn();
      }
    }

    document.body.innerHTML = `
      <for-test>
        <button data-actions="click:for-test.hello"></button>
      </for-test>
    `;

    await page.getByRole("button").click();

    expect(fn).toHaveBeenCalledOnce();
  });

  test("action has to have an access to element's instance", async () => {
    const fn = vi.fn();

    @controller
    class ForTest1Element extends HTMLElement {
      #what = "field";

      hello() {
        fn(this.#what);
      }
    }

    document.body.innerHTML = `
      <for-test1>
        <button data-actions="click:for-test1.hello"></button>
      </for-test1>
    `;

    await page.getByRole("button").click();

    expect(fn).toHaveBeenCalledWith("field");
  });

  test("multiple actions can be declared on one element", async () => {
    const fn = vi.fn();
    const fn2 = vi.fn();

    @controller
    class ForTest2Element extends HTMLElement {
      hello() {
        fn();
      }

      hello2() {
        fn2();
      }
    }

    document.body.innerHTML = `
      <for-test2>
        <button
          data-actions="
            click:for-test2.hello
            dblclick:for-test2.hello2
          "
        ></button>
      </for-test2>
    `;

    await page.getByRole("button").click();
    await page.getByRole("button").dblClick();

    expect(fn).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
  });

  test("action should be bound to the closest matching controller", async () => {
    @controller
    class ForTest3Element extends HTMLElement {
      hello = vi.fn();
    }

    document.body.innerHTML = `
      <for-test3>
        <for-test3>
          <button
            data-actions="
              click:for-test3.hello
            "
          ></button>
        </for-test3>
      </for-test3>
    `;

    await page.getByRole("button").click();

    const [first, second] = Array.from(
      /**
       * @type {NodeListOf<ForTest3Element>}
       */
      (document.body.querySelectorAll("for-test3")),
    );

    expect(first.hello).not.toHaveBeenCalledOnce();
    expect(second.hello).toHaveBeenCalledOnce();
  });

  test("actions can be defined dynamically", async () => {
    const fn = vi.fn();

    @controller
    class ForTest4Element extends HTMLElement {
      hello() {
        fn();
      }
    }

    document.body.innerHTML = `
      <for-test4>
        <button></button>
      </for-test4>
    `;

    const button = page.getByRole("button").element();
    await userEvent.click(button);
    expect(fn).not.toHaveBeenCalledOnce();

    button.setAttribute("data-actions", "click:for-test4.hello");
    await userEvent.click(button);
    expect(fn).toHaveBeenCalledOnce();
  });

  test("actions can be defined on dynamically added elements", async () => {
    const fn = vi.fn();

    @controller
    class ForTest5Element extends HTMLElement {
      hello() {
        fn();
      }
    }

    document.body.innerHTML = `
      <for-test5 />
    `;

    const forTestElement =
      /**
       * @type {HTMLElement | null}
       */
      (document.body.querySelector("for-test5"));

    await expect.element(forTestElement).toBeInTheDocument();

    const button = document.createElement("button");
    button.setAttribute("data-actions", "click:for-test5.hello");
    forTestElement?.append(button);

    await userEvent.click(button);
    expect(fn).toHaveBeenCalledOnce();
  });
});
