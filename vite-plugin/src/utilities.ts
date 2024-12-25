export type DeepPartial<A> = {
  [K in keyof A]?: DeepPartial<A[K]>;
};
