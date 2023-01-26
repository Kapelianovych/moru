# Moru (short of "モルモット" or "morumotto")

> A word to the previous owner of the `moru` package on npm:
>
> "I saw that the original package was unpublished in 2021 and is not available to install anymore. So I assume that you are not owning it now. If you have some concerns, please, write me back or open an issue here. I hope you don't mind if I take the name for my package."

Moru is a JavaScript library for building user interfaces.

- **Simple**. The best way to use any library effectively is by understanding how it works. Moru is as small and as simple as possible, so it won't be too hard to explore the source code. And maybe you have some ideas to make it even simpler and better 😉
- **Declarative**. It uses JSX to describe a markup in an HTML-like way. You probably already know pros and cons from the pioneer - [React](https://reactjs.org/). But Moru does not exploit Virtual DOM, so you won't pay a cost of reconciliation.
- **Reactive**. Reactivity is the core of the library. It is heavily inspired by the [S](https://github.com/adamhaile/S) library, but aims to be simpler with relatively the same power.
- **Functional**. No class components.
- **Portable**. It is easy to write a runtime for any environment.

## Installation

```shell
npm i moru
```

The library is distributed as non-minified and non-transpiled source code, so you have to transpile it by yourself in a way you want. Luckily, you don't have to worry about it as any bundler does it by default.

## Documentation

### Core

The library exports a `createElement` and a `Fragment` functions to create UI elements. The `createElement` expects for the `tag` as the first argument which can be a string or a function reference and for optional second object which consist of whatever properties are passed to the element. The function returns a `RegularElement` object which has 4 properties:

1. `tag` - a string or a functional component reference.
2. `ref` - a function which receives a reference to a native element created by the runtime.
3. `children` - a child element of the current one or array of children.
4. `attributes` - an object with all properties passed to the JSX element except the `ref` and `children`.

> The last three properties are separated from the second function's parameter.

The `Fragment` expect only for one parameter - `children` and returns a `FragmentElement` with only a `tag` property which is always equal to the `fragment` string and the `children` property. All other properties if exist in JSX are ignored.

To detect the `RegularElement` and the `FragmentElement` the library exports a `isJSXCoreElement` function.

> You usually won't interact with those function unless you are writing a custom runtime or except of some edge cases when you have to dynamically create the UI element.

JSX is converted to a bunch of nested `createElement` calls automatically by using the standard compiler which is suitable for React also.

### Reactivity

The exposed reactivity system consist of 5 hooks:

1. `useState`.
2. `useEffect`.
3. `useImmediateEffect`.
4. `useFree`.
5. `onError`.

You can use them without any restrictions unlike React's hooks.

#### useState

It creates a reactive variable that may be used in a reactive context (function) and that context will be able to track value's changes and reexecute itself. It accepts the default value and returns a tuple with value's getter and value's setter (both functions).

```js
const [valueGetter, valueSetter] = useState(0);
```

The getter returns an internal value. The setter updates the value. The latter can take either the new value or the function that takes the old value and have to return a new one.

```js
const value = valueGetter();
valueSetter(1);
valueSetter((old) => old + 1);
```

By default, before updating a value of the `useState` a new one is compared to the old by using the strict equality operator (`===`). Only distinct values cause an update. You can pass your own function to compare values:

```js
// Only changes of the _a_ property will cause an update of the state.
const [value, setValue] = useState(
  { a: 0, b: "" },
  { equals: (previous, next) => previous.a === next.a }
);
```

> You can disable comparing values by providing the custom `equals` function that always returns `false`. Then every execution of the setter will cause an update and reexecution of dependent reactive contexts.

#### useEffect

It creates the reactive context that reacts to updates of all reactive values used inside. It accepts a **synchronous** function which may return another function. The returned function clears artifacts right before the context is being destroyed.

```js
useEffect(() => {
  window.addEventListener("click", console.log);

  return () => window.removeEventListener("click", console.log);
});
```

It's an important thing that a context cannot detect declared, but _not invoked_, values.

```js
useEffect(() => {
  // If it returns `true`, then code inside _if_ is evaluated and
  // context will register the count state also. Otherwise, it won't.
  if (shouldBeExecuted()) {
    console.log(count());
  }
});
```

Effects can be nested. In that case inner effects are still independent meaning that changes of reactive values won't be cause rerender of outer effect, but an execution of the outer effect will cause invalidation of all inner effects. That means all registered cleaner functions of inner effects will be executed, then outer effect executes own cleaner function and after that a callback will be called causing registering all inner effects again.

```js
const [a, setA] = useState();
const [b, setB] = useState();

useEffect(() => {
  a(); // Change will reexecute the closest (the current) effect, clean and register again the inner effect.

  useEffect(() => {
    b(); // Change will reexecute only the closest (the current) effect.
  });
});
```

This hook doesn't execute the callback immediately, instead it queues it to be called after the current task is done but before the next one.

#### useImmediateEffect

This hook has exactly the same behaviour as the `useEffect` except that it executes the callback immediately.

```js
useImmediateEffect(() => console.log("I am executed right now"));
```

#### useFree

You may want to opt out of autotracking for some reactive values. To achieve this behaviour you have to wrap a computation in a function passed to the `useFree` hook.

```js
const [count, setCount] = useState(0);

useEffect(() => {
  // This effect will be executed only once and will ignore subsequent
  // setCount calls.
  useFree(() => console.log(count()));
  // or you can pass the getter himself
  console.log(useFree(count));
});
```

If you are creating an effect inside the free context, it will register every used dependency inside it though. That's because the `useFree` prevents a state to be registered by the outer effect and inner effects have separate contexts.

```js
const [count, setCount] = useState(0);

useEffect(() => {
  useFree(() => {
    // Won't be tracked by outer effect
    count();

    useEffect(() => {
      // Will be tracked by this effect
      count();
    });
  });
});
```

#### onError

This hook is used to declare a callback which will be executed if the current reactive context or an inner one throws an error. It is useful for catching errors and repair an application preventing a whole system from the fail.

```js
useEffect(() => {
  onError(console.error);

  useEffect(() => {
    useEffect(() => {
      throw new Error("I will be caught at the top-level useEffect.");
    });
  });
});
```

> The reactive system is designed to minimise updates by batching `StateSetter` calls and removing duplicated updates (when different states try to reexecute the same reactive context). When a first setter is called it queues an effect runner to be called in the next task. Until then all subsequent setter calls whenever they are called will be added to the list of updates of the queued runner. When runner starts calling queued updates if some of the updates queues the next update, the latter will be executed by the current runner. That means Moru batches all updates per each update phase which consist of `task + microtasks + task`.

### Runtimes

Moru includes implementation of several runtimes.

#### Web

This runtime is exposed under the `moru/web` module and is used to render JSX in the server environment (to string) and the browser environment (to DOM nodes). This runtime can be used for CSR, SSR and SSG.

It exports three constants:

1. `isServer` (_true_ on the server and _false_ on the browser).
2. `isBrowser` (_false_ on the server and _true_ on the browser).
3. `isHydrationEnabled` (indicates if rendered elements should be hydrated. This is useful when using SSR).

The server and browser environments have access to the `render` function that accepts the `JSX.Element` function and renders it to the string on the server and to DOM nodes on the browser.

The browser environment has also an access to the `hydrate` function that accepts the `JSX.Element` and optional second parameter as the root DOM node from which Moru should start hydration.

> This runtime is tree-shakeable meaning that if you don't use hydration, a bundler won't include the hydration code into the application. The same goes for the code under the `isServer` and `isBrowser` conditional blocks.

By default, hydration option is off. In order to enable it, configure you bundler to replace the `MORU_IS_HYDRATION_ENABLED` to `true` while bundling an application.

If you have been ever wrote JSX before, you know how to write JSX with Moru too. But there are some noticeable differences worth mentioning:

1.  Don't use the `className`, `htmlFor`, `defaultValue` and `dangerouslySetInnerHtml` attributes because they will be treated as regular attributes and of course have no meaning in HTML. Use the `class` and `for`. In case of the `dangerouslySetInnerHtml` Moru supports rendering native DOM nodes, so you can do like this:

        ```jsx
        export default ({ html }) => {
            const userDefinedHtml = document.createElement('div');
            userDefinedHtml.innerHTML = html; // Better use the Sanitization API for safety.

            return (
                <div>
                    <p></p>
                    {userDefinedHtml}
                </div>
            );
        }
        ```

2.  A function passed in any place of JSX creates a reactive context and is valid value. So if you want to change the attribute values depending of some value or change the markup, use the function.

        ```jsx
        export default () => {
            const [visible, setVisible] = useState(false);

            return (
                <div class={() => visible() ? 'visible' : 'hidden'}>
                    {() => visible() ? <p>I am visible</p> : null}
                </div>
            );
        }
        ```

3.  Only `null` and `undefined` will render nothing, other _falsy_ values will be rendered as is.
4.  The `class` attribute can accept an array with strings and objects. Use object when you want some classes be dynamically included or excluded. When a value is a _falsy_ value or returns a _falsy_ value it will be excluded from the `classList`. Otherwise, it will be preserved.

        ```jsx
        export default () => {
            const [visible, setVisible] = useState(false);

            return (
                <div
                    class={['I', 'am', 'static', 'class', { dynamic: () => visible() }]}
                ></div>
            );
        }
        ```

5.  The `style` attribute may be an object with key/values properties as CSS declarations. If you want a declaration to change the value dynamically, use the function.

        ```jsx
        export default () => {
            const [translateX, setTranslateX] = useState(0);

            return <div
              style={{
                opacity: 1,
                transform: () => `translateX(${translateX()}%)`,
                "background-color": "tomato",
              }}
            ></div>;
        }
        ```

        > `moru` uses the _element.style.setProperty_ method to set style's value, so you are able to define custom properties in there.

6.  Event listener's attribute name is case insensitive, so `onClick` is the same as `onclick`.All events are registered with a native `addEventListener` method and you can provide any option that is acceptable as the third parameter by adding an according suffix to the event name. Four suffixes are allowed:

        1. `Once` - sets the `once` option to `true`.
        2. `Capture` - sets the `capture` option to `true`.
        3. `Passive` - sets the `passive` option to `true`.
        4. `NoPassive` - sets the `passive` option to `false` explicitly.

        You can combine them together except `Passive` and `NoPassive`. If you do, then `NoPassive` wins.

        ```jsx
        <div onClickCaptureOnce={(event) => console.log(event)}></div>
        ```

        The `event` parameter is the native event object.

### For TypeScript users

Moru defines the global `JSX` namespace. If you are developing a new runtime and want to extend the `JSX.Element` type you should declare the `ElementMap` interface with some unique key (by default it is a number) and a desired type as the value.

```ts
type Obj = {
  /* */
};

declare global {
  namespace JSX {
    interface ElementMap {
      readonly 9: Obj;
    }
  }
}
```

With the same principle Moru supports custom elements. You have to declare the `RegularElementsMap` with the key as the element's tag name and it's properties object type as the value.

Example for defining custom web components for the `web` runtime.

```ts
type MyElementAttributes = {
  /* */
};

declare global {
  namespace JSX {
    interface RegularElementsMap {
      readonly "my-element": MyElementAttributes;
    }
  }
}
```

In case of the `web` runtime TypeScript will add some common attributes and events to that definition. It is up to the runtime typings whether to mix additional attributes or not.

### Using bundlers

You are free to use any bundler you want to compile the JSX. We recommend using Vite as the easiest way to start a new project.

For CSR the most minimal configuration is next:

```ts
export default {
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "moru",
  },
};
```

SSR is a bit trickier and you can use the [vite-plugin-ssr](https://vite-plugin-ssr.com) package for robust configuration but you have to include the next options:

```ts
export default {
  define: {
    MORU_IS_HYDRATION_ENABLED: true,
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "moru",
  },
};
```

To implement the SSG refer to the [Vite's documentation](https://vitejs.dev/guide/ssr.html#pre-rendering-ssg).

## Word from author

Have fun ✌️
