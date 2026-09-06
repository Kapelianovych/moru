import { describe, it, expect, test, vi } from "vitest";

import { DefaultGuard } from "../source/default-guard.js";
import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  HttpStatus,
  Handler,
  HttpMethod,
  Guard,
  Interceptor,
} from "../source/index.js";

describe("Application", () => {
  it("should create a function which accepts request and response objects", () => {
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [],
    });
    const listen = application.build();
    const _ = listen(new Request("http://localhost"), new Response());

    expect(listen).toBeTypeOf("function");
  });

  test("when no handler matches request, then response with 404 should be returned", async () => {
    const callback = vi.fn();
    const application = new Application({
      adapter: TestingAdapter.withRespondWith(callback),
      handlers: [],
    });
    const listen = application.build();
    const _ = await listen(new Request("http://localhost"), new Response());

    expect(callback.mock.lastCall?.[0].status).toBe(HttpStatus.NotFound);
  });

  it("should call default guard when an error happens", async () => {
    const error = new Error();
    const originalCatch = DefaultGuard.prototype.catch;
    DefaultGuard.prototype.catch = vi.fn();
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
        })
        class {
          /**
           * @returns {Response}
           */
          handle() {
            throw error;
          }
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(DefaultGuard.prototype.catch).toHaveBeenCalledExactlyOnceWith(error);
    DefaultGuard.prototype.catch = originalCatch;
  });

  it("should call explicitly defined guard instead of the default one", async () => {
    const error = new Error();
    const originalCatch = DefaultGuard.prototype.catch;
    DefaultGuard.prototype.catch = vi.fn();
    const explicitCatch = vi.fn();
    const application = new Application({
      adapter: TestingAdapter,
      guard:
        @Guard()
        class {
          catch = explicitCatch;
        },
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
        })
        class {
          /**
           * @returns {Response}
           */
          handle() {
            throw error;
          }
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(DefaultGuard.prototype.catch).not.toHaveBeenCalledOnce();
    expect(explicitCatch).toHaveBeenCalledExactlyOnceWith(error);
    DefaultGuard.prototype.catch = originalCatch;
  });

  test("interceptors should be called for every handler", async () => {
    const fn = vi.fn();
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
        })
        class {
          handle() {
            fn(0);
            return new Response("0");
          }
        },
        @Handler({
          pattern: "/foo",
          method: HttpMethod.Get,
        })
        class {
          async handle() {
            fn(1);
            return new Response("1");
          }
        },
      ],
      interceptors: [
        @Interceptor()
        class {
          /**
           * @param {function(): Response | Promise<Response>} handle
           */
          async intercept(handle) {
            fn("pre");
            const result = await handle();
            fn("post");
            return result;
          }
        },
      ],
    });
    const listen = application.build();
    let _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );
    _ = await listen(
      new Request("http://localhost/foo", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(fn.mock.calls).toStrictEqual([
      ["pre"],
      [0],
      ["post"],
      ["pre"],
      [1],
      ["post"],
    ]);
  });
});
