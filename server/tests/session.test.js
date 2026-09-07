import { describe, expect, it } from "vitest";

import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  Handler,
  Header,
  HttpMethod,
  Pipe,
} from "../source/index.js";

describe("session", () => {
  describe("Header", () => {
    it("should get header value from request", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Get,
          })
          class {
            @Header() contentType = "";

            handle() {
              value = this.contentType;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Get,
          headers: { "content-type": "text/plain" },
        }),
        new Response(),
      );

      expect(value).toBe("text/plain");
    });

    it("should be able to assign value to private property", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Get,
          })
          class {
            @Header() #contentType = "";

            handle() {
              value = this.#contentType;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Get,
          headers: { "content-type": "text/plain" },
        }),
        new Response(),
      );

      expect(value).toBe("text/plain");
    });

    it("should be able possible to use different name for header key", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Get,
          })
          class {
            @Header({ name: "content-type" }) #type = "";

            handle() {
              value = this.#type;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Get,
          headers: { "content-type": "text/plain" },
        }),
        new Response(),
      );

      expect(value).toBe("text/plain");
    });

    it("should be able possible to transform value with pipe", async () => {
      /**
       * @type {boolean | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Get,
          })
          class {
            @Header({
              name: "content-type",
              pipe:
                @Pipe()
                class {
                  /**
                   * @param {string} value
                   */
                  transform(value) {
                    return value.startsWith("text");
                  }
                },
            })
            #contentTypeIsText = false;

            handle() {
              value = this.#contentTypeIsText;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Get,
          headers: { "content-type": "text/plain" },
        }),
        new Response(),
      );

      expect(value).toBe(true);
    });

    it("should not be possible to use Header outside of service, pipe, handler, interceptor or guard", () => {
      class A {
        // @ts-expect-error
        @Header() foo = "";
      }

      expect(() => new A()).toThrow();
    });
  });
});
