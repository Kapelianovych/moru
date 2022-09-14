# Moru (short of "モルモット" or "morumotto")

> A word to the previous owner of the `moru` package on npm:
>
> "I saw that the original package was unpublished in 2021 and is not available to install anymore. So I assume that you are not owning it now. If you have some concerns, please, write me back or open an issue here. I hope you don't mind if I take the name for my package."

Moru is a JavaScript library for building user interfaces.

- **Simple**. The best way to use any library effectively is by understanding how it works. Moru is as small and as simple as possible, so it won't be hard to explore the source code. And maybe you have some ideas to make it even simpler and better 😉
- **Declarative**. It uses JSX to describe a markup in HTML-like way. You probably already know pros and cons from the pioneer - [React](https://reactjs.org/). But Moru renders every JSX element into the native `Node` objects, so you are closer to the DOM and don't pay the cost of the Virtual DOM and reconsiliation.
- **Reactive**. Reactivity is the core of the library. It is heavily inspired by the [S](https://github.com/adamhaile/S) library, but aims to be more simpler with the same power.
- **Functional**. No classes.

## Installation

```shell
npm i moru
```

The library is distributes as non-minified and non-transpiled source code, so you have to transpile it by yourself in a way that you want. Luckily, you don't have to worry about it as any bundler do it by default.

## Documentation

The library exports an `element` and a `Fragment` functions to create DOM nodes.

The `element` is used to create regular DOM nodes:

```JSX
const paragraph = <p></p>;

// Compiled output:
// const paragraph = element('p');
```

The `Fragment` is used to create a node that has no equivalent in the DOM tree. That is [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment):

```JSX
const content = <>
  <p>First paragraph</p>
  <p>Second paragraph</p>
</>;

const parent = <div>{content}</div>;

// The resulting HTML is:
//
// <div>
//   <p>First paragraph</p>
//   <p>Second paragraph</p>
// </div>
```

Instead of the `Fragment` you can also populate JSX elements in the array.

```JSX
const content = [
  <p>First paragraph</p>,
  <p>Second paragraph</p>
];

const parent = <div>{content}</div>;

// The resulting HTML is:
//
// <div>
//   <p>First paragraph</p>
//   <p>Second paragraph</p>
// </div>
```

If you will pass `null` and `undefined` as element's children they will be converted to the empty strings and inserted as _Text_ nodes. All other _falsy_ values will be stringified (so 0 becomes '0', false -> 'false'):

```JSX
const child = null;

const parent = <p>{child}</p>;
// Becomes HTML: <p></p>

const child2 = false;

const parent2 = <p>{child2}</p>;
// Becomes HTML: <p>false</p>
```

You can even pass native nodes as children:

```JSX
const child = document.createElement('p');

const parent = <div>{child}</div>;
// Becomes HTML: <div><p></p></div>
```

At the end, you can use a function as a child. If you use a reactive value (state) in there, then on every change of the reactive value that parts of the DOM will be updated:

```JSX
const [counter, setCounter] = useState(0);

const dom = <div>{() => counter()}</div>;
```

> See `useState` hook.

### Props

All props to the native elements are treated as attributes. All attribute names are **case-insensitive** (so `onclick` is the same as `onClick`). All kinds of values are allowed for props (though all of them will be converted to strings), but there are a couple that have special treatment:

1. `boolean`. If the value is `false`, then the attribute is omitted from the DOM. Otherwise, it will be retained.

   ```JSX
   <input readonly={false}/>
   ```

2. `function that returns a value`. In that case, if you use a reactive value inside the function, than any change of the value will update the attribute's value in the DOM.

   ```JSX
   const [counter, setCounter] = useState(0);

   <div class={() => counter()}></div>
   ```

### Event listeners

To attach an event listener to the element you can must write the `on` prefix followed by the name of the event and pass a function as a value to it. Function receives the native event object. You may write: `onclick`, `onClick`, `OnClick`, `OnCliCK` - all of them are the same.

```JSX
<div onclick={(event) => console.log(event)}></div>
```

All events are registered with a native `addEventListener` method and you can provide any option that is acceptable as the third parameter by adding an according suffix to the event name. Four suffixes are allowed:

1. `Once` - sets the `once` option to `true`.
2. `Capture` - sets the `capture` option to `true`.
3. `Passive` - sets the `passive` option to `true`.
4. `NoPassive` - sets the `passive` option to `false` explicitly.

You can combine them together except `Passive` and `NoPassive`. If you do, then `NoPassive` wins.

```JSX
<div onClickCaptureOnce={(event) => console.log(event)}></div>
```

### Class

Alongside the _strings_ and _function_ that attribute accepts an array of strings or objects. If you provide an object inside the array, then all keys with _truthy_ values will be added to the attribute. A function is allowed as a value also.

```JSX
const [isFullWidth, setFullWidth] = useState(false);

<div class={[{ 'h-full': true, 'w-full': () => isFullWidth() }, 'flex', 'items-center']}></div>
```

### Style

Alongside the _strings_ and _function_ that attribute's value may be an object with the same properties and values as the native node's `style`. There is one difference, that here you can define a function as a value.

```JSX
const [translateX, setTranslateX] = useState(false);

<div style={{
  opacity: '0',
  transform: () => `translateX(${translateX()}%)`
}}></div>
```

All other attributes are the same as in HTML. You are free to pass all `aria-*` and `data-*` attibutes as it is.

```JSX
<div data-id="foo"></div>
```

## Reactivity

There are two hooks available: `useState` and `useEffect`. You can use them without any restrictions unlike React's hooks.

### useState

It creates a reactive variable that may be used in the reactive context (function) and that context will be able to track value's changes and reexecute itself. It accepts the default value and returns a tuple with value getter and value setter (both functions).

```JavaScript
const [valueGetter, valueSetter] = useState(0);
```

The getter returns a internal value. The setter updates the value. The latter can take either the new value of the function that takes the old value and have to return a new one.

```JavaScript
valueSetter(1);
valueSetter((old) => old + 1);
```

### useEffect

It creates a context which you can use to register some job that should be done after the reactive value updates. It accepts a synchronous function which may return another function. The returned function clears the artifacts after the context is destroyed.

```JavaScript
useEffect(() => {
  window.addEventListener('click', console.log);

  return () => window.removeEventListener('click', console.log);
});
```

If you will use any reactive value inside it, then that context will be reexecuted after value's update.

> Only that hook and any function inside the JSX create a reactive context (except event listeners).

The context autodetects all states (reactive values) that are executed inside it. It's an important tthing that it cannot detect declared, but _not invoked_, values.

```JavaScript
useEffect(() => {
    // If it returns `true`, then code inside _if_ is evaluated and
    // context will register the count state also. Otherwise, it won't.
    if (shouldBeExecuted()) {
        console.log(count());
    }
});
```

## Word from author

Have fun ✌️
