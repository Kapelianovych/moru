import { describe, expect, it, vi } from "vitest";

import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  Guard,
  Handler,
  Header,
  HttpMethod,
  Interceptor,
  Pipe,
} from "../source/index.js";

describe("guard", () => {
  it("should return valid response", async () => {
    const response = new Response();
    const platformResponse = new Response();
    const respondWith = vi.fn();
    const application = new Application({
      adapter: TestingAdapter.withRespondWith(respondWith),
      handlers: [
        @Handler({
          guard:
            @Guard()
            class {
              catch() {
                return response;
              }
            },
          pattern: "/",
          method: HttpMethod.Get,
        })
        class {
          handle() {
            throw 0;
            return new Response();
          }
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      platformResponse,
    );

    expect(respondWith.mock.lastCall).toStrictEqual([
      response,
      platformResponse,
    ]);
  });

  it("should catch errors from interceptors also", async () => {
    const fn = vi.fn(() => new Response());
    const application = new Application({
      adapter: TestingAdapter,
      handlers: [
        @Handler({
          guard:
            @Guard()
            class {
              catch = fn;
            },
          pattern: "/",
          method: HttpMethod.Get,
          interceptors: [
            @Interceptor()
            class {
              intercept() {
                throw 0;
                return new Response();
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
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(fn).toHaveBeenCalledOnce();
  });

  it("should catch an error thrown by pipe", async () => {
    const fn = vi.fn();
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
          @Header({
            pipe:
              @Pipe()
              class {
                /**
                 * @param {string} value
                 */
                transform(value) {
                  throw 0;
                  return value;
                }
              },
          })
          contentType = "";

          handle() {
            return new Response();
          }
        },
      ],
    });
    const listen = application.build();
    const _ = await listen(
      new Request("http://localhost", { method: HttpMethod.Get }),
      new Response(),
    );

    expect(fn).toHaveBeenCalledExactlyOnceWith(0);
  });
});
