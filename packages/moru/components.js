import { memo } from "./enhancers.js";
import { immediately } from "./context.js";
import { createElement } from "./element.js";

export const For = (
  { each, children, fallback, key = (item) => item },
  context,
) => {
  let previousItemsKeys = [];

  const dataStates = [];
  const indexStates = [];

  const [elements, setElements] = context.state([]);

  context.effect(
    () => {
      let index = 0;
      const itemsKeys = [];
      const mappedElements = [];

      for (const item of each()) {
        const itemKey = key(item);

        itemsKeys.push(itemKey);

        const previousItemIndex = previousItemsKeys.indexOf(itemKey);

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

      previousItemsKeys = itemsKeys;

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
