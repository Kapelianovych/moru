/**
 * @import {
 *   EventEmitter as _EventEmitter,
 *   EventListener as _EventListener,
 *   EventListenerObject as _EventListenerObject,
 *   EventListenerFunction as _EventListenerFunction,
 * } from "./events.js";
 */

/**
 * @template A
 * @typedef {_EventEmitter<A>} EventEmitter
 */

/**
 * @template {Event} E
 * @typedef {_EventListener<E>} EventListener
 */

/**
 * @template {Event} E
 * @typedef {_EventListenerFunction<E>} EventListenerFunction
 */

/**
 * @template {Event} E
 * @typedef {_EventListenerObject<E>} EventListenerObject
 */

export { property } from "./properties.js";
export { controller } from "./controller.js";
export { event, listen } from "./events.js";
export { target, targets } from "./targets.js";
export { provide, consume } from "./context.js";
export { watch, attribute } from "./attributes.js";
