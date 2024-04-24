import { memo } from "./enhancers.js";
import { immediately } from "./context.js";
import { createElement } from "./element.js";

export const For = (
  { each, children, fallback, key = (item) => item },
  context,
) => {
  let previousItemKeys = [];

  const dataStates = [];
  const indexStates = [];

  const [elements, setElements] = context.state([]);

  context.effect(
    () => {
      let index = 0;
      const itemKeys = [];
      const itemKeysSet = new Set();
      const mappedElements = [];

      for (const item of each()) {
        let itemKey = key(item);

        if (itemKeysSet.has(itemKey))
          // Unfortunately a duplicate key has been found, fallback to the index
          // as a unique part of the key.
          itemKey = String(itemKey) + index;

        itemKeys.push(itemKey);
        itemKeysSet.add(itemKey);

        const previousItemIndex = previousItemKeys.indexOf(itemKey);

        if (previousItemIndex > -1) {
          mappedElements[index] = elements()[previousItemIndex];
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
          mappedElements[index] = elements()[index];
          dataStates[index][1](() => item);
        } else {
          const [dataGetter] = (dataStates[index] = context.state(
            item,
            (previous, next) => key(previous) === key(next),
          ));
          const [indexGetter] = (indexStates[index] = context.state(index));

          mappedElements[index] = context.resolve(
            children(dataGetter, indexGetter),
            index,
          );
        }

        index++;
      }

      previousItemKeys = itemKeys;

      // Keep states strictly equal to elements discarding excessive ones.
      indexStates.length = dataStates.length = mappedElements.length;

      setElements(mappedElements);
    },
    [each],
    immediately,
  );

  const List = memo(
    context,
    () => {
      const items = elements();

      return items.length ? items : fallback;
    },
    [elements],
  );

  return createElement(List, {});
};
