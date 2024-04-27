import { memo, provider, isContext, createElement, currentContext } from "moru";

export const store = (initial, reducer) => {
  const [HandlesProvider, getHandles] = provider();

  const StoreProvider = ({ children }, context) => {
    const [getStore, setStore] = context.state(initial, () => false);

    const select = (contextOrMap, selectorOrEquals, maybeEquals) => {
      if (!isContext(contextOrMap)) {
        maybeEquals = selectorOrEquals;
        selectorOrEquals = contextOrMap;
        contextOrMap = currentContext.ref;
      }

      return memo(
        contextOrMap,
        () => getStore(selectorOrEquals),
        [getStore],
        maybeEquals,
      );
    };

    const dispatch = (event) =>
      setStore((store) => {
        const reduced = reducer(store, event) ?? store;

        return store === reduced ? store : Object.assign(store, reduced);
      });

    return createElement(HandlesProvider, {
      value: [select, dispatch],
      children,
    });
  };

  const select = (context, selector, equals) =>
    getHandles(isContext(context) ? context : currentContext.ref)[0](
      context,
      selector,
      equals,
    );

  const dispatcher = (context = currentContext.ref) => getHandles(context)[1];

  return [StoreProvider, select, dispatcher];
};
