import { describe, expect, it } from "vitest";

import { TestingAdapter } from "./testing.adapter.js";
import {
  Application,
  Body,
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

    it("should use default value when header is absent", async () => {
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
            @Header() #contentType = "text-a";

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
        }),
        new Response(),
      );

      expect(value).toBe("text-a");
    });

    it("should not use default value when pipe is provided", async () => {
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
            @Header({
              pipe:
                @Pipe()
                class {
                  transform() {
                    return "pipe-text";
                  }
                },
            })
            #contentType = "text-a";

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
        }),
        new Response(),
      );

      expect(value).toBe("pipe-text");
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

  describe("Body", () => {
    it("should parse JSON body", async () => {
      /**
       * @type {Promise<number> | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Put,
          })
          class {
            // @ts-expect-error
            @Body() #body;

            handle() {
              value = this.#body;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Put,
          body: "1",
          headers: { "content-type": "application/json" },
        }),
        new Response(),
      );

      await expect(value).resolves.toBe(1);
    });

    it("should parse text body", async () => {
      /**
       * @type {Promise<string> | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Put,
          })
          class {
            // @ts-expect-error
            @Body() #body;

            handle() {
              value = this.#body;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Put,
          body: "1",
          headers: { "content-type": "text/plain" },
        }),
        new Response(),
      );

      await expect(value).resolves.toBe("1");
    });

    it("should parse formData body", async () => {
      /**
       * @type {Promise<FormData> | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Put,
          })
          class {
            // @ts-expect-error
            @Body() #body;

            handle() {
              value = this.#body;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const body = new FormData();
      body.append("name", "foo");
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Put,
          body,
        }),
        new Response(),
      );

      await expect(value).resolves.toBeInstanceOf(FormData);
      await expect(
        value?.then((formData) => formData.get("name")),
      ).resolves.toBe("foo");
    });

    it("should parse search parameters body as form data", async () => {
      /**
       * @type {Promise<URLSearchParams> | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Put,
          })
          class {
            // @ts-expect-error
            @Body() #body;

            handle() {
              value = this.#body;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const body = new URLSearchParams();
      body.append("name", "foo");
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Put,
          body,
          headers: { "content-type": "application/x-www-form-urlencoded" },
        }),
        new Response(),
      );

      await expect(value).resolves.toBeInstanceOf(FormData);
      await expect(
        value?.then((formData) => formData.get("name")),
      ).resolves.toBe("foo");
    });

    it("should parse binary body", async () => {
      /**
       * @type {Promise<ArrayBuffer> | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Put,
          })
          class {
            // @ts-expect-error
            @Body() #body;

            handle() {
              value = this.#body;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Put,
          body: new Uint8Array([64]),
          headers: { "content-type": "application/octet-stream" },
        }),
        new Response(),
      );

      await expect(value).resolves.toBeInstanceOf(ArrayBuffer);
      await expect(value?.then((value) => value.byteLength)).resolves.toBe(1);
    });

    it("should allow providing custom body parser", async () => {
      /**
       * @type {Promise<ArrayBuffer> | undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Put,
          })
          class {
            @Body(
              @Pipe()
              class {
                async transform() {
                  return "foo";
                }
              },
            )
            // @ts-expect-error
            #body;

            handle() {
              value = this.#body;
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Put,
        }),
        new Response(),
      );

      await expect(value).resolves.toBe("foo");
    });

    it("should allow assing body multiple time", async () => {
      /**
       * @type {Promise<[object, object]>| undefined}
       */
      let value;
      const application = new Application({
        adapter: TestingAdapter,
        handlers: [
          @Handler({
            pattern: "/",
            method: HttpMethod.Put,
          })
          class {
            // @ts-expect-error
            @Body() #body1;
            // @ts-expect-error
            @Body() #body2;

            handle() {
              value = Promise.all([this.#body1, this.#body2]);
              return new Response();
            }
          },
        ],
      });
      const listen = application.build();
      const _ = await listen(
        new Request("http://localhost", {
          method: HttpMethod.Put,
          body: JSON.stringify({ foo: 1 }),
          headers: { "content-type": "application/json" },
        }),
        new Response(),
      );

      await expect(value).resolves.toStrictEqual([{ foo: 1 }, { foo: 1 }]);
    });

    it("should not be possible to use Body outside of service, pipe, handler, interceptor or guard", () => {
      class A {
        // @ts-expect-error
        @Body() foo;
      }

      expect(() => new A()).toThrow();
    });
  });
});
