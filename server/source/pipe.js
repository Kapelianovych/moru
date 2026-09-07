/**
 * @import { SessionContext } from "./session.js";
 * @import { ContainerStoredInstance, ContainerStoredInstanceMetadata } from "./container.js";
 */

import { inferKeyFromClass } from "./key.js";
import { resolveSessionContext, runInSessionContext } from "./session.js";

/**
 * @template A
 * @template B
 * @typedef {Object} PipeOwnProperties
 * @property {function(A): B} transform
 */

/**
 * @template A
 * @template B
 * @template _
 * @typedef {ContainerStoredInstance & PipeOwnProperties<A, B>} Pipe
 */

/**
 * @template A
 * @template B
 * @template _
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Pipe<A, B, _>} PipeConstructor
 */

/**
 * @template {Array<PipeConstructor<any, any, any, []>>} P
 * @typedef {Object} PipeOwnOptions
 * @property {P} [pipes]
 */

/**
 * @template {Array<PipeConstructor<any, any, any, []>>} P
 * @typedef {Partial<ContainerStoredInstanceMetadata> & PipeOwnOptions<P>} PipeOptions
 */

/**
 * @template A
 * @template B
 * @typedef {Object} PipeOwnMetadata
 * @property {function(A, PipeConstructor<any, B, A, []>, SessionContext): B} transform
 */

/**
 * @template A
 * @template B
 * @typedef {ContainerStoredInstanceMetadata & PipeOwnMetadata<A, B>} PipeMetadata
 */

/**
 * @template {Array<any>} T
 * @template R
 * @typedef {|
 *  T extends []
 *    ? R
 *    : T extends [Promise<any>]
 *      ? Promise<R>
 *      : T extends [Promise<any>, ...infer _]
 *        ? Promise<R>
 *        : T extends [any, ...infer Rest]
 *          ? PipeResult<Rest, R>
 *          : never} PipeResult
 */

/**
 * @template A
 * @template B
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[]>} [options]
 * @returns {function(
 *  PipeConstructor<Awaited<A>, B, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<A>, B, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<B>, PipeResult<[B], C>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<B>, PipeResult<[B], C>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<C>, PipeResult<[A, B, C], D>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<C>, PipeResult<[A, B, C], D>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<D>, PipeResult<[A, B, C, D], E>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<D>, PipeResult<[A, B, C, D], E>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template F
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 *  PipeConstructor<any, E, Awaited<D>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<E>, PipeResult<[A, B, C, D, E], F>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<E>, PipeResult<[A, B, C, D, E], F>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template F
 * @template G
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 *  PipeConstructor<any, E, Awaited<D>, []>,
 *  PipeConstructor<any, F, Awaited<E>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<F>, PipeResult<[A, B, C, D, E, F], G>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<F>, PipeResult<[A, B, C, D, E, F], G>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template F
 * @template G
 * @template H
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 *  PipeConstructor<any, E, Awaited<D>, []>,
 *  PipeConstructor<any, F, Awaited<E>, []>,
 *  PipeConstructor<any, G, Awaited<F>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<G>, PipeResult<[A, B, C, D, E, F, G], H>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<G>, PipeResult<[A, B, C, D, E, F, G], H>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template F
 * @template G
 * @template H
 * @template I
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 *  PipeConstructor<any, E, Awaited<D>, []>,
 *  PipeConstructor<any, F, Awaited<E>, []>,
 *  PipeConstructor<any, G, Awaited<F>, []>,
 *  PipeConstructor<any, H, Awaited<G>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<H>, PipeResult<[A, B, C, D, E, F, G, H], I>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<H>, PipeResult<[A, B, C, D, E, F, G, H], I>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template F
 * @template G
 * @template H
 * @template I
 * @template J
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 *  PipeConstructor<any, E, Awaited<D>, []>,
 *  PipeConstructor<any, F, Awaited<E>, []>,
 *  PipeConstructor<any, G, Awaited<F>, []>,
 *  PipeConstructor<any, H, Awaited<G>, []>,
 *  PipeConstructor<any, I, Awaited<H>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<I>, PipeResult<[A, B, C, D, E, F, G, H, I], J>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<I>, PipeResult<[A, B, C, D, E, F, G, H, I], J>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template F
 * @template G
 * @template H
 * @template I
 * @template J
 * @template K
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 *  PipeConstructor<any, E, Awaited<D>, []>,
 *  PipeConstructor<any, F, Awaited<E>, []>,
 *  PipeConstructor<any, G, Awaited<F>, []>,
 *  PipeConstructor<any, H, Awaited<G>, []>,
 *  PipeConstructor<any, I, Awaited<H>, []>,
 *  PipeConstructor<any, J, Awaited<I>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<J>, PipeResult<[A, B, C, D, E, F, G, H, I, J], K>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<J>, PipeResult<[A, B, C, D, E, F, G, H, I, J], K>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template C
 * @template D
 * @template E
 * @template F
 * @template G
 * @template H
 * @template I
 * @template J
 * @template K
 * @template L
 * @template {Array<any>} Args
 * @overload
 * @param {PipeOptions<[
 *  PipeConstructor<any, B, Awaited<A>, []>,
 *  PipeConstructor<any, C, Awaited<B>, []>,
 *  PipeConstructor<any, D, Awaited<C>, []>,
 *  PipeConstructor<any, E, Awaited<D>, []>,
 *  PipeConstructor<any, F, Awaited<E>, []>,
 *  PipeConstructor<any, G, Awaited<F>, []>,
 *  PipeConstructor<any, H, Awaited<G>, []>,
 *  PipeConstructor<any, I, Awaited<H>, []>,
 *  PipeConstructor<any, J, Awaited<I>, []>,
 *  PipeConstructor<any, K, Awaited<J>, []>,
 * ]>} options
 * @returns {function(
 *  PipeConstructor<Awaited<K>, PipeResult<[A, B, C, D, E, F, G, H, I, J, K], L>, Awaited<A>, Args>,
 *  ClassDecoratorContext<PipeConstructor<Awaited<K>, PipeResult<[A, B, C, D, E, F, G, H, I, J, K], L>, Awaited<A>, Args>>
 * ): void}
 */
/**
 * @template A
 * @template B
 * @template {Array<any>} Args
 * @param {PipeOptions<Array<PipeConstructor<any, any, any, []>>>} [options]
 */
export function Pipe(options) {
  /**
   * @param {PipeConstructor<Awaited<A>, B, Awaited<A>, Args>} target
   * @param {ClassDecoratorContext<PipeConstructor<Awaited<A>, B, Awaited<A>, Args>>} context
   */
  return (target, context) => {
    context.metadata.key = options?.key ?? inferKeyFromClass(target, /pipe$/i);
    context.metadata.singleton = options?.singleton;
    context.metadata.transform =
      /**
       * @param {A} value
       * @param {PipeConstructor<any, B | Promise<B>, any, []>} selfConstructor
       * @param {SessionContext} sessionContext
       * @returns {B | Promise<B>}
       */
      (value, selfConstructor, sessionContext) => {
        const pipes = options?.pipes ?? [];
        const result = pipes.reduce(
          (value, pipeConstructor) => {
            if (value instanceof Promise) {
              return value.then((value) =>
                runInSessionContext(sessionContext, () =>
                  runPipe(value, pipeConstructor),
                ),
              );
            } else {
              return runInSessionContext(sessionContext, () =>
                runPipe(value, pipeConstructor),
              );
            }
          },
          /**
           * @type {any}
           */
          (value),
        );
        if (result instanceof Promise) {
          return result.then((value) =>
            runPipeWith(value, selfConstructor, sessionContext),
          );
        } else {
          return runPipeWith(result, selfConstructor, sessionContext);
        }
      };
  };
}

/**
 * @template A
 * @template B
 * @param {A} value
 * @param {PipeConstructor<any, B, A, []>} pipeConstructor
 * @returns {B}
 */
export function runPipe(value, pipeConstructor) {
  const { transform } =
    /**
     * @type {PipeMetadata<A, B>}
     */
    (pipeConstructor[Symbol.metadata]);
  const sessionContext = resolveSessionContext();
  return transform(value, pipeConstructor, sessionContext);
}

/**
 * @template A
 * @template B
 * @param {A} value
 * @param {PipeConstructor<A, B, A, []>} pipeConstructor
 * @param {SessionContext} sessionContext
 * @returns {B}
 */
function runPipeWith(value, pipeConstructor, sessionContext) {
  return runInSessionContext(sessionContext, () =>
    sessionContext.container.resolve(pipeConstructor),
  ).transform(value);
}
