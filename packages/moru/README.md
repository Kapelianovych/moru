# Moru (short of "モルモット" or "morumotto")

> A word to the previous owner of the `moru` package on npm:
>
> "I saw that the original package was unpublished in 2021 and is not available to install anymore. So I assume that you are not owning it now. If you have some concerns, please, write me back or open an issue here. I hope you don't mind if I take the name for my package."

Moru is a JavaScript library for building user interfaces.

- **Simple**. The best way to use any library effectively is by understanding how it works. Moru is as small and as simple as possible, so it won't be too hard to explore the source code. And maybe you have some ideas to make it even simpler and better 😉
- **Declarative**. It uses JSX to describe a markup in an HTML-like way. You probably already know pros and cons from the pioneer - [React](https://reactjs.org/). But Moru renders every JSX element into the native `Node` objects, so you are closer to the DOM and don't pay the cost of the Virtual DOM and reconsiliation.
- **Reactive**. Reactivity is the core of the library. It is heavily inspired by the [S](https://github.com/adamhaile/S) library, but aims to be simpler with the same power.
- **Functional**. No classes.

## Installation

```shell
npm i moru
```

The library is distributed as non-minified and non-transpiled source code, so you have to transpile it by yourself in a way you want. Luckily, you don't have to worry about it as any bundler does it by default.

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

Alongside the _strings_ and _function_ attribute's value may be an object with the same properties and values as the native `style` tag accepts. There is one difference, that here you can define a function as a value.

```JSX
const [translateX, setTranslateX] = useState(0);

<div style={{
  opacity: 1,
  transform: () => `translateX(${translateX()}%)`,
  'background-color': 'tomato'
}}></div>
```

> `moru` uses the _element.style.setProperty_ method to set style's value, so you are able to define custom properties in there.

All other attributes are the same as in HTML. You are free to pass all `aria-*` and `data-*` attributes as they are.

```JSX
<div data-id="foo"></div>
```

> `moru` supports [the automatic runtime feature](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) so you can omit imports of the `element` and `Fragment` entities.

### Children

You can nest JSX elements inside each other.

```JavaScript
// component
const Header = () => (
  <header></header>
);

<div>
  <Header />
  <p>Moru</p>
</div>
```

Besides JSX elements, a child can be any primitive (`null` and `undefined` are rendered as empty text nodes), an array (in that case every item will be rendered as a child) or function which is interpreted as `inline component` in a reactive context.

```JavaScript
const [value] = useState('value');

<div>
 {null}
 {0}
 {[<p>Child</p>]}
 {() => value()}
</div>

// <div>
//   0
//   <p>Child</p>
//   value
// </div>
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

JSX tags create native DOM nodes, so you can pass it to every DOM API.

```JavaScript
document.body.prepend(<div></div>);
```

## Reactivity

There are four hooks available:

1. `useState`
2. `useEffect`
3. `useMemo`
4. `useBatch`

You can use them without any restrictions unlike React's hooks.

### useState

It creates a reactive variable that may be used in the reactive context (function) and that context will be able to track value's changes and reexecute itself. It accepts the default value and returns a tuple with value's getter and value's setter (both functions).

```JavaScript
const [valueGetter, valueSetter] = useState(0);
```

The getter returns an internal value. The setter updates the value. The latter can take either the new value or the function that takes the old value and have to return a new one.

```JavaScript
const value = valueGetter();
valueSetter(1);
valueSetter((old) => old + 1);
```

Setter does not trigger an update of the state immediately. Instead, it queues the update after the current task is complete (UI update or some other important operation). If you know that updating have to be done as soon as possible, you can pass an _options_ object to the setter with an _immediate_ property set to `true`.

```JavaScript
valueSetter(3, { immediate: true });
```

By default, before updating a value of the `useState` a new one is compared to the old by using the strict equality operator (`===`). Only distinct values cause an update. You can pass your own function to compare values:

```JavaScript
// Only changes of the _a_ property will cause an update of the state.
const [value, setValue] = useState({ a: 0, b: '' }, { equals: (previous, next) => previous.a === next.a });
```

> You can disable comparing values by providing the `equals` function that always returns `false`. Then every execution of the setter will cause an update and reexecution of dependent reactive contexts.

### useEffect

It creates a context that you can use to register some job that should be done each time the reactive value which is used inside the context is updated. It accepts a synchronous function which may return another function. The returned function clears the artifacts after the context is destroyed.

```JavaScript
useEffect(() => {
  window.addEventListener('click', console.log);

  return () => window.removeEventListener('click', console.log);
});
```

It's an important thing that a context cannot detect declared, but _not invoked_, values.

```JavaScript
useEffect(() => {
    // If it returns `true`, then code inside _if_ is evaluated and
    // context will register the count state also. Otherwise, it won't.
    if (shouldBeExecuted()) {
        console.log(count());
    }
});
```

You may want to opt out of autotracking for some reactive values. To achieve this behaviour instead of calling a getter function use its `raw` property.

```JavaScript
const [count, setCount] = useState(0);

useEffect(() => {
  // This effect will be executed only once and will ignore subsequent
  // setCount calls.
  console.log(count.raw);
});
```

### useMemo

It creates a derived computation that is reexecuted when some dependency (reactive value) used inside it is changed. The hook returns a getter function that returns a result of the computation. The getter is recognized by reactive contexts as a dependency (it is basically the same thing as the first value of the `useState`'s tuple).

```JavaScript
const [count, setCount] = useState(0);

const sum = useMemo((previousSum = 0) => previousSum + count());

useEffect(() => console.log(sum()));
```

`useMemo` accepts a callback that receives the previous value (or _undefined_ on the first run) and returns a new one. The hook can accept an _options_ object with the `equals` property which has the same meaning as the _options_ in the `useState`.

### useBatch

Postpones rerunning all depending effects until the end of the callback. If inside the callback different state setters are executed, all dependent reactive scopes are executed at most once. State setters with `immediate: true` will mark that their dependent scopes as such that must be executed _before_ others.

```JavaScript
const [a, setA] = useState(0);
const [b, setB] = useState('');

useEffect(() => {
  console.log(a());
  console.log(b());
});

// effect above will be executed only once on update of two states.
useBatch(() => {
  setA(3);
  setB('hello');
});
```

> Effects, reactive contexts in JSX and memos are always executed in a batch.

## SSR

The package has basic support of rendering the JSX to _string_ in non-browser environments.

## Word from author

Have fun ✌️
