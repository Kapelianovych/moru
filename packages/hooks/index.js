export const createState = (context, initial, options) => {
  const [value, setValue, _] = context.createState(initial, options);

  return [value, setValue];
};

export const createEffect = (context, callback, dependencies) => {
  context.createEffect(callback, dependencies);
};

export const createUrgentEffect = (context, callback, dependencies) => {
  context.createUrgentEffect(callback, dependencies);
};

export const createMemo = (context, callback, dependencies, options) => {
  const [value, setValue] = createState(context, null, options);

  createUrgentEffect(
    context,
    (...parameters) =>
      setValue((oldValue) => callback(oldValue, ...parameters)),
    dependencies
  );

  return value;
};

export const createProvider = (initial) => {
  let _value = initial;

  return [
    ({ value, children }, context) => {
      _value = value;

      createEffect(context, () => () => (_value = initial));

      return children;
    },
    () => _value,
  ];
};

export const createResource = (context, fetcher, dependencies) => {
  const pendingState = { state: "pending" };

  const [value, updateValue] = createState(context, pendingState);

  createEffect(
    context,
    (...parameters) => {
      updateValue(pendingState);

      fetcher(...parameters).then(
        (result) => updateValue({ state: "fulfilled", value: result }),
        (error) => updateValue({ state: "rejected", value: error })
      );
    },
    dependencies
  );

  return value;
};
