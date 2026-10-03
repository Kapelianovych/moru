/**
 * @import { EventEmitter } from "@moru/controller";
 */

import { Controller, Event, Listen } from "@moru/controller";
import { vi, describe, expect, test } from "vitest";

import { render } from "./render.js";

describe("events", () => {
  test("event should create event emitter with the event name matching the property's name", () => {
    const fn = vi.fn();

    @Controller()
    class EventTestElement extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @Event() foo;

      emitEvent() {
        this.foo.emit(null);
      }
    }

    window.addEventListener("foo", fn);

    const container = render(`
      <event-test />
    `);

    const eventTestElement =
      /**
       * @type {EventTestElement}
       */
      (container.firstElementChild);

    eventTestElement.emitEvent();

    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.lastCall?.[0].type).toBe("foo");
  });

  test("listen should catch event which type is equal to property name", () => {
    const fn = vi.fn();

    @Controller()
    class EventTest1Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @Event() foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @Controller()
    class ListenTest1Element extends HTMLElement {
      @Listen() foo = fn;
    }

    render(`
      <listen-test1>
        <event-test1 />
      </listen-test1>
    `);

    expect(fn).toHaveBeenCalled();
  });

  test("listen can be applied to object with handleEvent method", () => {
    const fn = vi.fn();

    @Controller()
    class EventTest2Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @Event() foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @Controller()
    class ListenTest2Element extends HTMLElement {
      @Listen() foo = this;

      handleEvent = fn;
    }

    render(`
      <listen-test2>
        <event-test2 />
      </listen-test2>
    `);

    expect(fn).toHaveBeenCalled();
  });

  test("function-listener should pertain it's access to this", () => {
    const fn = vi.fn();

    @Controller()
    class EventTest3Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @Event() foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @Controller()
    class ListenTest3Element extends HTMLElement {
      #prop = 3;

      @Listen() foo() {
        fn(this.#prop);
      }
    }

    render(`
      <listen-test3>
        <event-test3 />
      </listen-test3>
    `);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.lastCall?.[0]).toBe(3);
  });

  test("object-listener should pertain it's access to this", () => {
    const fn = vi.fn();

    @Controller()
    class EventTest4Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @Event() foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @Controller()
    class ListenTest4Element extends HTMLElement {
      #prop = 4;

      @Listen() foo = this;

      handleEvent() {
        fn(this.#prop);
      }
    }

    render(`
      <listen-test4>
        <event-test4 />
      </listen-test4>
    `);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.lastCall?.[0]).toBe(4);
  });

  test("Event can explicitly accept event name", () => {
    const fn = vi.fn();

    @Controller()
    class EventTest5Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @Event("bar") foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @Controller()
    class ListenTest5Element extends HTMLElement {
      #prop = 4;

      @Listen() bar = this;

      handleEvent() {
        fn(this.#prop);
      }
    }

    render(`
      <listen-test5>
        <event-test5 />
      </listen-test5>
    `);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.lastCall?.[0]).toBe(4);
  });

  test("Listen can explicitly accept event name", () => {
    const fn = vi.fn();

    @Controller()
    class EventTest6Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @Event("bar") foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @Controller()
    class ListenTest6Element extends HTMLElement {
      #prop = 4;

      @Listen("bar") foo = this;

      handleEvent() {
        fn(this.#prop);
      }
    }

    render(`
      <listen-test6>
        <event-test6 />
      </listen-test6>
    `);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.lastCall?.[0]).toBe(4);
  });
});
