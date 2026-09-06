import { describe, expect, it, test, vi } from "vitest";

import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  Handler,
  HttpMethod,
  Interceptor,
} from "../source/index.js";

describe("interceptor", () => {
  it("should prevent handler from being called", async () => {
    const fn = vi.fn();
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
          interceptors: [
            @Interceptor()
            class {
              intercept() {
                return new Response("0");
              }
            },
          ],
        })
        class {
          handle = fn;
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(fn).not.toHaveBeenCalledOnce();
  });

  it("should prevent following interceptor from being called", async () => {
    const intercept = vi.fn();
    const fn = vi.fn();
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
          interceptors: [
            @Interceptor()
            class {
              intercept() {
                return new Response("0");
              }
            },
            @Interceptor()
            class {
              intercept = intercept;
            },
          ],
        })
        class {
          handle = fn;
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(fn).not.toHaveBeenCalledOnce();
    expect(intercept).not.toHaveBeenCalledOnce();
  });

  it("should return valid response", async () => {
    const response = new Response();
    const nativeResponse = new Response();
    const respondWith = vi.fn();
    const application = new Application({
      adapter: TestingAdapter.withRespondWith(respondWith),
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
          interceptors: [
            @Interceptor()
            class {
              intercept() {
                return response;
              }
            },
          ],
        })
        class {
          handle() {
            return new Response("1");
          }
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      nativeResponse,
    );

    expect(respondWith.mock.lastCall).toStrictEqual([response, nativeResponse]);
  });

  test("global interceptors should be called before handler interceptors", async () => {
    /**
     * @type {Array<number>}
     */
    const order = [];
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          pattern: "/",
          method: HttpMethod.Get,
          interceptors: [
            @Interceptor()
            class {
              /**
               * @param {function(): Response | Promise<Response>} handle
               */
              intercept(handle) {
                order.push(2);
                return handle();
              }
            },
          ],
        })
        class {
          handle() {
            return new Response();
          }
        },
      ],
      interceptors: [
        @Interceptor()
        class {
          /**
           * @param {function(): Response | Promise<Response>} handle
           */
          intercept(handle) {
            order.push(1);
            return handle();
          }
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(order).toStrictEqual([1, 2]);
  });
});
