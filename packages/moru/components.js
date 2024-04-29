import { context } from "./context.js";
import { createElement } from "./element.js";
import { memo, cached, discard } from "./enhancers.js";

const createChild = (
  forContext,
  key,
  item,
  index,
  itemKey,
  children,
  dataStates,
  indexStates,
  mappedNodes,
) => {
  const itemContext = context(forContext);

  const [dataGetter] = (dataStates[index] = itemContext.state(
    item,
    (previous, next) => key(previous) === key(next),
  ));
  const [indexGetter] = (indexStates[index] = itemContext.state(index));

  (mappedNodes[index] = cached(
    itemContext,
    children(dataGetter, indexGetter),
  )).itemKey = itemKey;
};

const swapArray = (array, previousIndex, nextIndex) => {
  const previousItem = array[previousIndex];
  array[previousIndex] = array[nextIndex];
  array[nextIndex] = previousItem;
};

const createKeysFor = (items, generateKey) => {
  const keys = new Map();

  for (let index = 0; index < items.length; index++) {
    let key = generateKey(items[index]);

    if (Number.isFinite(key))
      // Don't allow keys as numbers to avoid resetting some index.
      key = String(key);

    if (keys.has(key))
      // Unfortunately a duplicate key has been found.
      // Try make the key unique.
      key = String(key) + index;

    keys.set(key, index);
    keys.set(index, key);
  }

  return keys;
};

const discardUnusedNodes = (cachedNodes, unusedKeys) => {
  const { done, value } = unusedKeys.keys().next();

  // In a Map when iteration is completed only `done` property is present.
  if (done) return;

  const index = Number.isFinite(value) ? value : unusedKeys.get(value);

  discard(cachedNodes[index]);
  unusedKeys.delete(unusedKeys.get(index));
  unusedKeys.delete(index);

  discardUnusedNodes(cachedNodes, unusedKeys);
};

export const For = (
  { each, children, fallback, key = (item) => item },
  forContext,
) => {
  const dataStates = [];
  const indexStates = [];
  let previousKeys = new Map();

  return memo(
    forContext,
    (cachedNodes = []) => {
      const nextKeys = createKeysFor(each(), key);
      const mappedNodes = new Array(each().length);

      for (let index = 0; index < each().length; index++) {
        const item = each()[index];
        const itemKey = nextKeys.get(index);

        if (previousKeys.has(itemKey)) {
          const previousIndex = previousKeys.get(itemKey);

          if (index !== previousIndex) {
            swapArray(dataStates, previousIndex, index);
            swapArray(indexStates, previousIndex, index);
            swapArray(cachedNodes, previousIndex, index);

            previousKeys.set(previousIndex, previousKeys.get(index));
            previousKeys.set(previousKeys.get(index), previousIndex);
          }

          previousKeys.delete(itemKey);
          previousKeys.delete(index);

          mappedNodes[index] = cachedNodes[index];
          indexStates[index][1](index);
        } else if (index < dataStates.length) {
          if (nextKeys.has(previousKeys.get(index))) {
            const nextIndex = cachedNodes.length;

            swapArray(dataStates, index, nextIndex);
            swapArray(indexStates, index, nextIndex);
            swapArray(cachedNodes, index, nextIndex);

            previousKeys.set(nextIndex, previousKeys.get(index));
            previousKeys.set(previousKeys.get(index), nextIndex);
            previousKeys.delete(index);

            createChild(
              forContext,
              key,
              item,
              index,
              itemKey,
              children,
              dataStates,
              indexStates,
              mappedNodes,
            );
          } else {
            previousKeys.delete(previousKeys.get(index));
            previousKeys.delete(index);

            (mappedNodes[index] = cachedNodes[index]).itemKey = itemKey;
            dataStates[index][1](() => item);
          }
        } else
          createChild(
            forContext,
            key,
            item,
            index,
            itemKey,
            children,
            dataStates,
            indexStates,
            mappedNodes,
          );
      }

      discardUnusedNodes(cachedNodes, previousKeys);
      previousKeys = nextKeys;
      // Keep states strictly equal to elements discarding excessive ones.
      indexStates.length = dataStates.length = mappedNodes.length;

      return mappedNodes.length ? mappedNodes : [fallback];
    },
    [each],
  );
};

export const Show = ({ when, fallback, children }, context) =>
  memo(context, () => (when() ? children : fallback), [when]);

export const Await = (props, context) => {
  const [error, setError] = context.state();
  const [result, setResult] = context.state();
  const [pending, setPending] = context.state();
  const [showContent, setShowContent] = context.state();

  context.effect(() => {
    setPending(true);
    props.transition || setShowContent(false);

    props
      .for()
      .then((result) => {
        setResult(result);
        setError(undefined);
      }, setError)
      .finally(() => {
        setPending(false);
        setShowContent(true);
      });
  }, props.on);

  return createElement(Show, {
    when: showContent,
    fallback: props.pending,
    children: createElement(Show, {
      when: error,
      fallback: props.children(result, pending),
      children: props.catch?.(error, pending),
    }),
  });
};
