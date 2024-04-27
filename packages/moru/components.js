import { createElement } from "./element.js";
import { context, immediately } from "./context.js";
import { memo, cached, discard } from "./enhancers.js";

export const For = (
  { each, children, fallback, key = (item) => item },
  forContext,
) => {
  let previousItemKeys = [];

  const dataStates = [];
  const indexStates = [];

  const [cachedNodes, setCachedNodes] = forContext.state([]);

  forContext.effect(
    () => {
      let index = 0;
      const itemKeys = new Set();
      const mappedNodes = [];
      const reusedNodeIndexes = new Set();

      for (const item of each()) {
        let itemKey = key(item);

        if (itemKeys.has(itemKey))
          // Unfortunately a duplicate key has been found, fallback to the index
          // as a unique part of the key.
          itemKey = String(itemKey) + index;

        itemKeys.add(itemKey);

        const previousItemIndex = previousItemKeys.indexOf(itemKey);

        if (previousItemIndex > -1) {
          reusedNodeIndexes.add(previousItemIndex);
          mappedNodes[index] = cachedNodes()[previousItemIndex];

          dataStates.splice(
            index,
            0,
            ...dataStates.splice(previousItemIndex, 1),
          );
          indexStates.splice(
            index,
            0,
            ...indexStates.splice(previousItemIndex, 1),
          );

          indexStates[index][1](index);
        } else if (index < dataStates.length) {
          reusedNodeIndexes.add(index);
          mappedNodes[index] = cachedNodes()[index];
          dataStates[index][1](() => item);
        } else {
          const itemContext = context();

          const [dataGetter] = (dataStates[index] = itemContext.state(
            item,
            (previous, next) => key(previous) === key(next),
          ));
          const [indexGetter] = (indexStates[index] = itemContext.state(index));

          mappedNodes[index] = cached(
            itemContext,
            children(dataGetter, indexGetter),
          );
        }

        index++;
      }

      previousItemKeys = [...itemKeys];
      cachedNodes().forEach(
        (cachedNode, index) =>
          reusedNodeIndexes.has(index) || discard(cachedNode),
      );
      // Keep states strictly equal to elements discarding excessive ones.
      indexStates.length = dataStates.length = mappedNodes.length;

      setCachedNodes(mappedNodes);
    },
    [each],
    immediately,
  );

  return memo(
    forContext,
    () => (cachedNodes().length ? cachedNodes() : fallback),
    [cachedNodes],
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
