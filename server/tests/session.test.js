import { describe, expect, it } from "vitest";

import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  Group,
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

  describe("Group", () => {
    it("should get group value from handler URL pattern", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/:foo",
            method: HttpMethod.Get,
          })
          class {
            @Group() foo = "";

            handle() {
              value = this.foo;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost/some", {
          method: HttpMethod.Get,
        }),
        new Response(),
      );

      expect(value).toBe("some");
    });

    it("should use default value when group is not defined", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/a/:foo?",
            method: HttpMethod.Get,
          })
          class {
            @Group() foo = "def";

            handle() {
              value = this.foo;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost/a", {
          method: HttpMethod.Get,
        }),
        new Response(),
      );

      expect(value).toBe("def");
    });

    it("should not use default value when pipe is explicitly set", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/a/:foo?",
            method: HttpMethod.Get,
          })
          class {
            @Group({
              pipe:
                @Pipe()
                class {
                  transform() {
                    return "bar";
                  }
                },
            })
            foo = "def";

            handle() {
              value = this.foo;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost/a", {
          method: HttpMethod.Get,
        }),
        new Response(),
      );

      expect(value).toBe("bar");
    });

    it("should use be able to infer group value from private property", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/:foo",
            method: HttpMethod.Get,
          })
          class {
            @Group() #foo = "";

            handle() {
              value = this.#foo;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost/some", {
          method: HttpMethod.Get,
        }),
        new Response(),
      );

      expect(value).toBe("some");
    });

    it("should be able possible to use different name for group key", async () => {
      /**
       * @type {string | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/:bar",
            method: HttpMethod.Get,
          })
          class {
            @Group({ name: "bar" }) #type = "";

            handle() {
              value = this.#type;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost/some", {
          method: HttpMethod.Get,
        }),
        new Response(),
      );

      expect(value).toBe("some");
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
            pattern: "/:foo",
            method: HttpMethod.Get,
          })
          class {
            @Group({
              name: "foo",
              pipe:
                @Pipe()
                class {
                  /**
                   * @param {string} value
                   */
                  transform(value) {
                    return value.startsWith("so");
                  }
                },
            })
            #isFoo = false;

            handle() {
              value = this.#isFoo;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost/some", {
          method: HttpMethod.Get,
        }),
        new Response(),
      );

      expect(value).toBe(true);
    });

    it("should not be possible to use Group outside of service, pipe, handler, interceptor or guard", () => {
      class A {
        // @ts-expect-error
        @Group() foo = "";
      }

      expect(() => new A()).toThrow();
    });
  });
});
