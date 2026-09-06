import { describe, it, expect, vi, test } from "vitest";

import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  Guard,
  Handler,
  HttpMethod,
  TryNextResponse,
} from "../source/index.js";

describe("handler", () => {
  it("should call handler when URL and method match", async () => {
    const response = new Response("1");
    const handle = vi.fn(() => {
      return response;
    });
    const callback = vi.fn();
    const application = new Application({
      adapter: TestingAdapter.withRespondWith(callback),
      handlers: [
        @Handler({
          pattern: "/foo",
          method: HttpMethod.Get,
        })
        class {
          handle = handle;
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost/foo", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(handle).toHaveBeenCalledOnce();
    expect(callback.mock.lastCall?.[0]).toBe(response);
  });

  it("should call first matching handler", async () => {
    const handle1 = vi.fn(() => {
      return new Response();
    });
    const handle2 = vi.fn(() => {
      return new Response();
    });
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/foo",
          method: HttpMethod.Get,
        })
        class {
          handle = handle1;
        },
        @Handler({
          pattern: "/foo",
          method: HttpMethod.Get,
        })
        class {
          handle = handle2;
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost/foo", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(handle1).toHaveBeenCalledOnce();
    expect(handle2).not.toHaveBeenCalledOnce();
  });

  it("should call second matching handler if first returns try next command", async () => {
    const handle1 = vi.fn(() => {
      return TryNextResponse;
    });
    const handle2 = vi.fn(() => {
      return new Response();
    });
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/foo",
          method: HttpMethod.Get,
        })
        class {
          handle = handle1;
        },
        @Handler({
          pattern: "/foo",
          method: HttpMethod.Get,
        })
        class {
          handle = handle2;
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost/foo", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(handle1).toHaveBeenCalledOnce();
    expect(handle2).toHaveBeenCalledOnce();
  });

  test("when guard is set on handler, it should be called when error is thrown", async () => {
    const fn = vi.fn(
      /**
       * @param {number} error
       */
      (error) => {
        return new Response();
      },
    );
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
          guard:
            @Guard()
            class {
              catch = fn;
            },
        })
        class {
          /**
           * @returns {Response}
           */
          handle() {
            throw 1;
          }
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(fn).toHaveBeenCalledOnce();
  });
});
