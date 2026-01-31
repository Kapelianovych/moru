/**
 * @import { EventEmitter } from "@moru/controller";
 */

import { controller, event, listen } from "@moru/controller";
import { vi, describe, expect, test } from "vitest";

import { render } from "./render.js";

describe("events", () => {
  test("event should create event emitter with the event name matching the property's name", () => {
    const fn = vi.fn();

    @controller
    class EventTestElement extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @event foo;

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

    @controller
    class EventTest1Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @event foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @controller
    class ListenTest1Element extends HTMLElement {
      @listen foo = fn;
    }

    render(`
      <listen-test1>
        <event-test1 />
      </listen-test1>
    `);

    expect(fn).toBeCalled();
  });

  test("listen can be applied to object with handleEvent method", () => {
    const fn = vi.fn();

    @controller
    class EventTest2Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @event foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @controller
    class ListenTest2Element extends HTMLElement {
      @listen foo = this;

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

    @controller
    class EventTest3Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @event foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @controller
    class ListenTest3Element extends HTMLElement {
      #prop = 3;

      @listen foo() {
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

    @controller
    class EventTest4Element extends HTMLElement {
      /**
       * @type {EventEmitter<null>}
       */
      // @ts-expect-error the property is initialised by decorator.
      @event foo;

      connectedCallback() {
        this.foo.emit(null);
      }
    }

    @controller
    class ListenTest4Element extends HTMLElement {
      #prop = 4;

      @listen foo = this;

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
});
