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

const swap = (array, previousIndex, nextIndex) => {
  const previousItem = array[previousIndex];
  array[previousIndex] = array[nextIndex];
  array[nextIndex] = previousItem;
};

const createKeysFor = (items, generateKey) => {
  const keysSet = new Set();
  const keysArray = new Array(items.length);

  for (let index = 0; index < items.length; index++) {
    let key = generateKey(items[index]);

    if (keysSet.has(key))
      // Unfortunately a duplicate key has been found, fallback to the index
      // as a unique part of the key.
      key = String(key) + index;

    keysSet.add(key);
    keysArray[index] = key;
  }

  return [keysSet, keysArray];
};

export const For = (
  { each, children, fallback, key = (item) => item },
  forContext,
) => {
  const dataStates = [];
  const indexStates = [];
  let previousKeysArray = [];

  return memo(
    forContext,
    (cachedNodes = []) => {
      const mappedNodes = new Array(each().length);
      const [nextKeysSet, nextKeysArray] = createKeysFor(each(), key);

      for (let index = 0; index < each().length; index++) {
        const item = each()[index];
        const itemKey = nextKeysArray[index];

        const previousIndex = previousKeysArray.indexOf(itemKey);

        if (previousIndex > -1) {
          swap(dataStates, previousIndex, index);
          swap(indexStates, previousIndex, index);
          swap(previousKeysArray, previousIndex, index);
          swap(cachedNodes, previousIndex, index);

          mappedNodes[index] = cachedNodes[index];
          indexStates[index][1](index);
        } else if (index < dataStates.length) {
          const previousCachedNodeItemKey = previousKeysArray[index];

          if (nextKeysSet.has(previousCachedNodeItemKey)) {
            swap(dataStates, index, cachedNodes.length);
            swap(indexStates, index, cachedNodes.length);
            swap(previousKeysArray, index, cachedNodes.length);
            swap(cachedNodes, index, cachedNodes.length);

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

      previousKeysArray = nextKeysArray;
      cachedNodes.forEach(
        (cachedNode) =>
          nextKeysSet.has(cachedNode?.itemKey) || discard(cachedNode),
      );
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
