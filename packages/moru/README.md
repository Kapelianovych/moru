# Moru (short of "モルモット" or "morumotto")

> A word to the previous owner of the `moru` package on npm:
>
> "I saw that the original package was unpublished in 2021 and is not available to install anymore. So I assume that you are not owning it now. If you have some concerns, please, write me back or open an issue here. I hope you don't mind if I take the name for my package."

Moru is a JavaScript library for building user interfaces.

- **Simple**. The best way to use any library effectively is by understanding how it works. Moru is as small and as simple as possible, so it won't be too hard to explore the source code. And maybe you have some ideas to make it even simpler and better 😉
- **Declarative**. It uses JSX to describe a markup in an HTML-like way. You probably already know pros and cons from the pioneer - [React](https://reactjs.org/). But Moru renders every JSX element into the native `Node` objects, so you are closer to the DOM and don't pay the cost of the Virtual DOM and reconsiliation.
- **Reactive**. Reactivity is the core of the library. It is heavily inspired by the [S](https://github.com/adamhaile/S) library, but aims to be simpler with the same power.
- **Functional**. No class components.

## Installation

```shell
npm i moru
```

The library is distributed as non-minified and non-transpiled source code, so you have to transpile it by yourself in a way you want. Luckily, you don't have to worry about it as any bundler does it by default.

## Documentation

The library exports an `element` and a `Fragment` functions to create DOM nodes.

The `element` is used to create regular DOM nodes:

```jsx
const paragraph = <p></p>;

// Compiled output:
// const paragraph = element('p');
```

The `Fragment` is used to create a node that is not visible to the user. That is [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment):

```jsx
const content = (
  <>
    <p>First paragraph</p>
    <p>Second paragraph</p>
  </>
);

const parent = <div>{content}</div>;

// The resulting HTML is:
//
// <div>
//   <p>First paragraph</p>
//   <p>Second paragraph</p>
// </div>
```

Instead of the `Fragment` you can also populate JSX elements in the array.

```jsx
const content = [<p>First paragraph</p>, <p>Second paragraph</p>];

const parent = <div>{content}</div>;

// The resulting HTML is:
//
// <div>
//   <p>First paragraph</p>
//   <p>Second paragraph</p>
// </div>
```

If you pass `null` and `undefined` as element's children, they will be converted to the empty strings and inserted as _Text_ nodes. All other _falsy_ values will be stringified (so 0 becomes '0', false -> 'false' and so on):

```jsx
const child = null;

const parent = <p>{child}</p>;
// Becomes HTML: <p></p>

const child2 = false;

const parent2 = <p>{child2}</p>;
// Becomes HTML: <p>false</p>
```

You can even pass native nodes as children:

```jsx
const child = document.createElement("p");

const parent = <div>{child}</div>;
// Becomes HTML: <div><p></p></div>
```

Finally, you can use a function as a child. If you use a reactive value (state) in there, then on every change of the reactive value that part of the DOM will be updated:

```jsx
const [counter, setCounter] = useState(0);

const dom = <div>{() => counter()}</div>;
```

> See `useState` hook.

### Props

All props to the native elements are treated as attributes. All attribute names are **case-insensitive** (so `onclick` is the same as `onClick`). All kinds of values are allowed for props (though all of them will be converted to strings), but there are a couple that have special treatment:

1. `boolean`. If the value is `false`, then the attribute is omitted from the DOM. Otherwise, it will be retained.

```jsx
<input readonly={false} />
```

2. `function that returns a value`. In that case, if you use a reactive value inside the function, than any change of the value will update the attribute's value in the DOM.

```jsx
const [state, setState] = useState(Math.random());

<div class={() => (state() > 0.5 ? "active" : "lazy")}></div>;
```

### Event listeners

To attach an event listener to the element you must write the `on` prefix followed by the name of the event and pass a function as a value to it. Function receives the native event object. You may write: `onclick`, `onClick`, `OnClick`, `OnCliCK` - all of them are the same.

```jsx
<div onclick={(event) => console.log(event)}></div>
```

All events are registered with a native `addEventListener` method and you can provide any option that is acceptable as the third parameter by adding an according suffix to the event name. Four suffixes are allowed:

1. `Once` - sets the `once` option to `true`.
2. `Capture` - sets the `capture` option to `true`.
3. `Passive` - sets the `passive` option to `true`.
4. `NoPassive` - sets the `passive` option to `false` explicitly.

You can combine them together except `Passive` and `NoPassive`. If you do, then `NoPassive` wins.

```jsx
<div onClickCaptureOnce={(event) => console.log(event)}></div>
```

### Class

Alongside the _string_ and _function_ that attribute accepts an array of strings or objects. If you provide an object inside the array, then all keys with _truthy_ values will be added to the attribute. A function is allowed as a value also.

```jsx
const [isFullWidth, setFullWidth] = useState(false);

<div
  class={[
    { "h-full": true, "w-full": () => isFullWidth() },
    "flex",
    "items-center",
  ]}
></div>;
```

### Style

Alongside the _string_ and _function_ attribute's value may be an object with the same properties and values as the native `style` tag accepts. There is one difference, that here you can define a function as a value.

```jsx
const [translateX, setTranslateX] = useState(0);

<div
  style={{
    opacity: 1,
    transform: () => `translateX(${translateX()}%)`,
    "background-color": "tomato",
  }}
></div>;
```

> `moru` uses the _element.style.setProperty_ method to set style's value, so you are able to define custom properties in there.

All other attributes are the same as in HTML. You are free to pass all `aria-*` and `data-*` attributes as they are.

```jsx
<div data-id="foo"></div>
```

> `moru` supports [the automatic runtime feature](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) so you can omit imports of the `element` and `Fragment` entities.

### Children

You can nest JSX elements inside each other.

```jsx
// component
const Header = () => <header></header>;

<div>
  <Header />
  <p>Moru</p>
</div>;
```

> Actually, all values that are assignable to the `JSX.Element` type are considered as valid children. The type consist of:
>
> 1. `null`
> 2. `undefined`
> 3. `string`
> 4. `number`
> 5. `bigint`
> 6. `boolean`
> 7. `Node`
> 8. `readonly JSX.Element[]`
> 9. `() => JSX.Element` (inline component)

## Reactivity

There are four hooks available:

1. `useState`
2. `useEffect`
3. `useMemo`
4. `useFree`

You can use them without any restrictions unlike React's hooks.

### useState

It creates a reactive variable that may be used in the reactive context (function) and that context will be able to track value's changes and reexecute itself. It accepts the default value and returns a tuple with value's getter and value's setter (both functions).

```js
const [valueGetter, valueSetter] = useState(0);
```

The getter returns an internal value. The setter updates the value. The latter can take either the new value or the function that takes the old value and have to return a new one.

```js
const value = valueGetter();
valueSetter(1);
valueSetter((old) => old + 1);
```

Setter does not trigger an update of the state immediately. Instead, it queues the update after the current task is complete (UI update or some other important operation). Basically, `moru` always tries to minimise the amount of work to be done after some state changes.

By default, before updating a value of the `useState` a new one is compared to the old by using the strict equality operator (`===`). Only distinct values cause an update. You can pass your own function to compare values:

```js
// Only changes of the _a_ property will cause an update of the state.
const [value, setValue] = useState(
  { a: 0, b: "" },
  { equals: (previous, next) => previous.a === next.a }
);
```

> You can disable comparing values by providing the `equals` function that always returns `false`. Then every execution of the setter will cause an update and reexecution of dependent reactive contexts.

### useEffect

It creates a context that you can use to register some job that should be done each time the reactive value which is used inside the context is updated. It accepts a synchronous function which may return another function. The returned function clears the artifacts after the context is destroyed.

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

### useMemo

It creates a derived computation that is reexecuted when some dependency (reactive value) used inside it is changed. The hook returns a getter function that returns a result of the computation. The getter is recognized by reactive contexts as a dependency (it is basically the same thing as the first value of the `useState`'s tuple).

```js
const [count, setCount] = useState(0);

const sum = useMemo((previousSum = 0) => previousSum + count());

useEffect(() => console.log(sum()));
```

`useMemo` accepts a callback that receives the previous value (or _undefined_ on the first run) and returns a new one. The hook can accept an _options_ object with the `equals` property which has the same meaning as the _options_ in the `useState`.

### useFree

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

## SSR

The package has basic support of rendering the JSX to _string_ in non-browser environments.

## Word from author

Have fun ✌️
