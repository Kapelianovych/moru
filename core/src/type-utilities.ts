export type Cast<A, B> = A extends B ? A : B;

export interface Stringifiable {
  toString(): string;
}
