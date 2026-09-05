/**
 * @import { SessionResponse } from "../source/index.js";
 */

import { describe, it, expect, test, vi } from "vitest";

import { DefaultGuard } from "../source/default-guard.js";
import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  HttpStatus,
  Handler,
  HttpMethod,
  TryNext,
  Guard,
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

  it("should call handler when URL and method match", async () => {
    const response = new Response("1");
    const handle = vi.fn(
      /**
       * @returns {SessionResponse}
       */
      () => {
        return response;
      },
    );
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
    const handle1 = vi.fn(
      /**
       * @returns {SessionResponse}
       */
      () => {
        return new Response();
      },
    );
    const handle2 = vi.fn(
      /**
       * @returns {SessionResponse}
       */
      () => {
        return new Response();
      },
    );
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
    const handle1 = vi.fn(
      /**
       * @returns {SessionResponse}
       */
      () => {
        return TryNext;
      },
    );
    const handle2 = vi.fn(
      /**
       * @returns {SessionResponse}
       */
      () => {
        return new Response();
      },
    );
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
           * @returns {SessionResponse}
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
           * @returns {SessionResponse}
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
});
