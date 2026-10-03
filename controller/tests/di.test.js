import { vi, describe, expect, test } from "vitest";
import { Controller, Inject, Injectable } from "@moru/controller";

import { render } from "./render.js";

describe("di", () => {
  test("should inject the service if requester element has container as an ancestor", () => {
    @Injectable()
    class AService {}

    @Controller({
      factories: [],
    })
    class ForFooElement extends HTMLElement {}

    @Controller()
    class ForBarElement extends HTMLElement {
      /**
       * @type {AService}
       */
      @Inject(AService)
      // @ts-expect-error we are expecting AService instance to be there.
      a;
    }

    const containerElement = render(`
      <for-foo>
        <for-bar />
      </for-foo>
    `);

    const forBarElement =
      /**
       * @type {ForBarElement}
       */
      (containerElement.querySelector("for-bar"));

    expect(forBarElement.a).toBeInstanceOf(AService);
  });

  test("injecting without parent container does not modify the target property", () => {
    @Injectable()
    class A1Service {}

    @Controller()
    class ForBar1Element extends HTMLElement {
      /**
       * @type {A1Service}
       */
      @Inject(A1Service)
      // @ts-expect-error we are expecting A1Service instance to be there.
      a;
    }

    const containerElement = render(`
      <for-bar1 />
    `);

    const forBar1Element =
      /**
       * @type {ForBar1Element}
       */
      (containerElement.querySelector("for-bar1"));

    expect(forBar1Element.a).toBeUndefined();
  });

  test("by default all services are singletons", () => {
    @Injectable()
    class AService {}

    @Controller({ factories: [] })
    class ForFoo1Element extends HTMLElement {}

    @Controller()
    class ForBar2Element extends HTMLElement {
      /**
       * @type {AService}
       */
      @Inject(AService)
      // @ts-expect-error we are expecting AService instance to be there.
      a;
      /**
       * @type {AService}
       */
      @Inject(AService)
      // @ts-expect-error we are expecting AService instance to be there.
      #a;

      get aSecondService() {
        return this.#a;
      }
    }

    const containerElement = render(`
      <for-foo1>
        <for-bar2 />
      </for-foo1>
    `);

    const forBar2Element =
      /**
       * @type {ForBar2Element}
       */
      (containerElement.querySelector("for-bar2"));

    expect(forBar2Element.a).toBe(forBar2Element.aSecondService);
  });

  test("service can be injected into private property", () => {
    @Injectable()
    class AService {}

    @Controller({ factories: [] })
    class ForFoo3Element extends HTMLElement {}

    @Controller()
    class ForBar3Element extends HTMLElement {
      /**
       * @type {AService}
       */
      @Inject(AService)
      // @ts-expect-error we are expecting AService instance to be there.
      #a;

      get aService() {
        return this.#a;
      }
    }

    const containerElement = render(`
      <for-foo3>
        <for-bar3 />
      </for-foo3>
    `);

    const forBar3Element =
      /**
       * @type {ForBar3Element}
       */
      (containerElement.querySelector("for-bar3"));

    expect(forBar3Element.aService).toBeInstanceOf(AService);
  });

  test("services marked as singleton: false must be instantiated on every inject call", () => {
    @Injectable({ singleton: false })
    class AService {}

    @Controller({ factories: [] })
    class ForFoo4Element extends HTMLElement {}

    @Controller()
    class ForBar4Element extends HTMLElement {
      /**
       * @type {AService}
       */
      @Inject(AService)
      // @ts-expect-error we are expecting AService instance to be there.
      a;
      /**
       * @type {AService}
       */
      @Inject(AService)
      // @ts-expect-error we are expecting AService instance to be there.
      #a;

      get aSecondService() {
        return this.#a;
      }
    }

    const containerElement = render(`
      <for-foo4>
        <for-bar4 />
      </for-foo4>
    `);

    const forBar4Element =
      /**
       * @type {ForBar4Element}
       */
      (containerElement.querySelector("for-bar4"));

    expect(forBar4Element.a).not.toBe(forBar4Element.aSecondService);
  });

  test("the dispose method of non-singleton service should be called when element is deattached from the DOM", () => {
    const fn = vi.fn();

    @Injectable({ singleton: false })
    class AService {
      dispose = fn;
    }

    @Controller({ factories: [] })
    class DiContainer1Element extends HTMLElement {}

    @Controller()
    class DiTest1Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @Inject(AService) a;
    }

    const containerElement = render("<di-container1 />");

    expect(fn).not.toHaveBeenCalledOnce();

    const diTestElement = document.createElement("di-test1");

    expect(fn).not.toHaveBeenCalledOnce();

    containerElement.firstElementChild?.append(diTestElement);

    expect(fn).not.toHaveBeenCalledOnce();

    diTestElement.remove();

    expect(fn).toHaveBeenCalledOnce();
  });

  test("the dispose method of singleton service should be called when container is deattached from the DOM", () => {
    const fn = vi.fn();

    @Injectable()
    class AService {
      dispose = fn;
    }

    @Controller({ factories: [] })
    class DiContainer2Element extends HTMLElement {}

    @Controller()
    class DiTest2Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @Inject(AService) a;
    }

    const containerElement = render("<di-container2 />");

    expect(fn).not.toHaveBeenCalledOnce();

    const diTestElement = document.createElement("di-test2");

    expect(fn).not.toHaveBeenCalledOnce();

    containerElement.firstElementChild?.append(diTestElement);

    expect(fn).not.toHaveBeenCalledOnce();

    diTestElement.remove();

    expect(fn).not.toHaveBeenCalledOnce();

    containerElement.firstElementChild?.remove();

    expect(fn).toHaveBeenCalledOnce();
  });

  test("the dispose method of the non-singleton service should be called again when element is deattached again from the DOM", () => {
    const fn = vi.fn();

    @Injectable({ singleton: false })
    class AService {
      dispose = fn;
    }

    @Controller({ factories: [] })
    class DiContainer4Element extends HTMLElement {}

    @Controller()
    class DiTest4Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @Inject(AService) a;
    }

    const containerElement = render(`
      <di-container4>
        <di-test4 />
      </di-container4>
    `);

    const diTestElement =
      /**
       * @type {DiTest4Element}
       */
      (containerElement.querySelector("di-test4"));

    containerElement.firstElementChild?.removeChild(diTestElement);
    containerElement.firstElementChild?.append(diTestElement);
    containerElement.firstElementChild?.removeChild(diTestElement);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("the dispose method of the singleton service should be called again when the container is deattached again from the DOM", () => {
    const fn = vi.fn();

    @Injectable({ singleton: true })
    class AService {
      dispose = fn;
    }

    @Controller({ factories: [] })
    class DiContainer5Element extends HTMLElement {}

    @Controller()
    class DiTest5Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @Inject(AService) a;
    }

    const containerElement = render(`
      <di-container5>
        <di-test5 />
      </di-container5>
    `);

    const diContainerElement =
      /**
       * @type {DiContainer5Element}
       */
      (containerElement.firstElementChild);

    containerElement.removeChild(diContainerElement);
    containerElement.append(diContainerElement);
    containerElement.removeChild(diContainerElement);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("subclass of an injectable class can replace it on inject call", () => {
    @Injectable()
    class A {
      foo = 1;
    }

    class B extends A {
      bar() {
        return this.foo;
      }
    }

    @Controller({ factories: [[A, B]] })
    class DiContainer6Element extends HTMLElement {}

    @Controller()
    class DiTest6Element extends HTMLElement {
      /**
       * @type {A | undefined}
       */
      @Inject(A) foo;
    }

    const containerElement = render(`
      <di-container6>
        <di-test6 />
      </di-container6>
    `);

    const diContainerElement =
      /**
       * @type {DiContainer6Element}
       */
      (containerElement.firstElementChild);
    const diTestElement =
      /**
       * @type {DiTest6Element}
       */
      (diContainerElement.firstElementChild);

    expect(diTestElement.foo).toBeInstanceOf(B);
  });

  test("injectables with same key can be substitutes for each other on inject call", () => {
    @Injectable({ key: "1" })
    class A {
      foo = 1;
    }

    @Injectable({ key: "1" })
    class B {
      foo = 2;
    }

    @Controller({ factories: [[A, B]] })
    class DiContainer7Element extends HTMLElement {}

    @Controller()
    class DiTest7Element extends HTMLElement {
      /**
       * @type {A | undefined}
       */
      @Inject(A) foo;
    }

    const containerElement = render(`
      <di-container7>
        <di-test7 />
      </di-container7>
    `);

    const diContainerElement =
      /**
       * @type {DiContainer7Element}
       */
      (containerElement.firstElementChild);
    const diTestElement =
      /**
       * @type {DiTest7Element}
       */
      (diContainerElement.firstElementChild);

    expect(diTestElement.foo).toBeInstanceOf(B);
  });

  test("injectables with same key and singleton option can be substitutes for each other on inject call", () => {
    @Injectable({ key: "1", singleton: false })
    class A {
      foo = 1;
    }

    @Injectable({ key: "1", singleton: false })
    class B {
      foo = 2;
    }

    @Controller({ factories: [[A, B]] })
    class DiContainer8Element extends HTMLElement {}

    @Controller()
    class DiTest8Element extends HTMLElement {
      /**
       * @type {A | undefined}
       */
      @Inject(A) foo;
    }

    const containerElement = render(`
      <di-container8>
        <di-test8 />
      </di-container8>
    `);

    const diContainerElement =
      /**
       * @type {DiContainer8Element}
       */
      (containerElement.firstElementChild);
    const diTestElement =
      /**
       * @type {DiTest8Element}
       */
      (diContainerElement.firstElementChild);

    expect(diTestElement.foo).toBeInstanceOf(B);
  });

  test("injectables with different key or singleton option can not be substitutes for each other on inject call", () => {
    @Injectable({ key: "1", singleton: false })
    class A {
      foo = 1;
    }

    @Injectable({ key: "2", singleton: false })
    class B {
      foo = 2;
    }

    @Controller({ factories: [[A, B]] })
    class DiContainer9Element extends HTMLElement {}

    @Controller()
    class DiTest9Element extends HTMLElement {
      /**
       * @type {A | undefined}
       */
      @Inject(A) foo;
    }

    const containerElement = render(`
      <di-container9>
        <di-test9 />
      </di-container9>
    `);

    const diContainerElement =
      /**
       * @type {DiContainer9Element}
       */
      (containerElement.firstElementChild);
    const diTestElement =
      /**
       * @type {DiTest9Element}
       */
      (diContainerElement.firstElementChild);

    expect(diTestElement.foo).toBeInstanceOf(A);
    expect(diTestElement.foo).not.toBeInstanceOf(B);
  });
});
