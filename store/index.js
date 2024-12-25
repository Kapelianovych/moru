import { createElement, currentContext, memo, provider } from "moru";

export const store = (initial, reducer) => {
  const [HandlesProvider, getHandles] = provider();

  const StoreProvider = ({ children }, context) => {
    const [getStore, setStore] = context.state(initial, () => false);

    const select = (context, selector, equals) =>
      memo(context, () => getStore(selector), [getStore], equals);

    const dispatch = (event) =>
      setStore((store) => {
        const reduced = reducer(store, event, dispatch);

        reduced && Object.assign(store, reduced);

        return store;
      });

    return createElement(HandlesProvider, {
      value: [select, dispatch],
      children,
    });
  };

  const use = (context = currentContext.ref) => {
    const [select, dispatch] = getHandles(context);

    return [select.bind(null, context), dispatch];
  };

  return [StoreProvider, use];
};
