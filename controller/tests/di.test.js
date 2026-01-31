import { vi, describe, expect, test } from "vitest";
import { container, controller, inject, service } from "@moru/controller";

import { render } from "./render.js";

describe("di", () => {
  test("should inject the service if requester element has container as an ancestor", () => {
    @service()
    class AService {}

    @controller
    @container(AService)
    class ForFooElement extends HTMLElement {}

    @controller
    class ForBarElement extends HTMLElement {
      /**
       * @type {AService}
       */
      @inject
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
    @service()
    class A1Service {}

    @controller
    class ForBar1Element extends HTMLElement {
      /**
       * @type {A1Service}
       */
      @inject
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
    @service()
    class AService {}

    @controller
    @container(AService)
    class ForFoo1Element extends HTMLElement {}

    @controller
    class ForBar2Element extends HTMLElement {
      /**
       * @type {AService}
       */
      @inject
      // @ts-expect-error we are expecting AService instance to be there.
      a;
      /**
       * @type {AService}
       */
      @inject
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
    @service()
    class AService {}

    @controller
    @container(AService)
    class ForFoo3Element extends HTMLElement {}

    @controller
    class ForBar3Element extends HTMLElement {
      /**
       * @type {AService}
       */
      @inject
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
    @service({ singleton: false })
    class AService {}

    @controller
    @container(AService)
    class ForFoo4Element extends HTMLElement {}

    @controller
    class ForBar4Element extends HTMLElement {
      /**
       * @type {AService}
       */
      @inject
      // @ts-expect-error we are expecting AService instance to be there.
      a;
      /**
       * @type {AService}
       */
      @inject
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

  test("the initialise method of the service should be called when element is connected to the DOM for the first time", () => {
    const fn = vi.fn();

    @service()
    class AService {
      initialise = fn;
    }

    @controller
    @container(AService)
    class DiContainerElement extends HTMLElement {}

    @controller
    class DiTestElement extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @inject a;
    }

    const containerElement = render("<di-container />");

    expect(fn).not.toHaveBeenCalledOnce();

    const diTestElement = document.createElement("di-test");

    expect(fn).not.toHaveBeenCalledOnce();

    containerElement.firstElementChild?.append(diTestElement);

    expect(fn).toHaveBeenCalledOnce();
  });

  test("the dispose method of non-singleton service should be called when element is deattached from the DOM", () => {
    const fn = vi.fn();

    @service({ singleton: false })
    class AService {
      dispose = fn;
    }

    @controller
    @container(AService)
    class DiContainer1Element extends HTMLElement {}

    @controller
    class DiTest1Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @inject a;
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

    @service()
    class AService {
      dispose = fn;
    }

    @controller
    @container(AService)
    class DiContainer2Element extends HTMLElement {}

    @controller
    class DiTest2Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @inject a;
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

  test("the initialise method of the non-singleton service should be called again when element is reconnected to the DOM", () => {
    const fn = vi.fn();

    @service({ singleton: false })
    class AService {
      initialise = fn;
    }

    @controller
    @container(AService)
    class DiContainer3Element extends HTMLElement {}

    @controller
    class DiTest3Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @inject a;
    }

    const containerElement = render(`
      <di-container3>
        <di-test3 />
      </di-container3>
    `);

    const diTestElement =
      /**
       * @type {DiTest3Element}
       */
      (containerElement.querySelector("di-test3"));

    containerElement.firstElementChild?.removeChild(diTestElement);
    containerElement.firstElementChild?.append(diTestElement);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("the dispose method of the non-singleton service should be called again when element is deattached again from the DOM", () => {
    const fn = vi.fn();

    @service({ singleton: false })
    class AService {
      dispose = fn;
    }

    @controller
    @container(AService)
    class DiContainer4Element extends HTMLElement {}

    @controller
    class DiTest4Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @inject a;
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

    @service({ singleton: true })
    class AService {
      dispose = fn;
    }

    @controller
    @container(AService)
    class DiContainer5Element extends HTMLElement {}

    @controller
    class DiTest5Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @inject a;
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

  test("the initialise method of the singleton service must not be called the second time and onward if a requester is reattached to the DOM", () => {
    const fn = vi.fn();

    @service({ singleton: true })
    class AService {
      initialise = fn;
    }

    @controller
    @container(AService)
    class DiContainer6Element extends HTMLElement {}

    @controller
    class DiTest6Element extends HTMLElement {
      /**
       * @type {AService}
       */
      // @ts-expect-error service will be injected at initialisation.
      @inject a;
    }

    const containerElement = render(`
      <di-container6>
        <di-test6 />
      </di-container6>
    `);

    const diTestElement =
      /**
       * @type {DiTest6Element}
       */
      (document.querySelector("di-test6"));

    containerElement.firstElementChild?.removeChild(diTestElement);
    containerElement.firstElementChild?.append(diTestElement);

    expect(fn).toHaveBeenCalledOnce();
  });
});
