/**
 * @import { Service as _Service } from "./di.js";
 * @import {
 *   Observer as _Observer,
 *   ObserverSubscriber as _ObserverSubscriber,
 * } from "./observers.js";
 * @import {
 *   Context as _Context,
 *   ContextType as _ContextType,
 *   UnknownContext as _UnknownContext,
 *   ContextCallback as _ContextCallback,
 * } from "./context.js";
 * @import {
 *   EventEmitter as _EventEmitter,
 *   EventListener as _EventListener,
 *   EventListenerObject as _EventListenerObject,
 *   EventListenerFunction as _EventListenerFunction,
 * } from "./events.js";
 */

/**
 * @template KeyType
 * @template ValueType
 * @typedef {_Context<KeyType, ValueType>} Context
 */

/**
 * @template {UnknownContext} T
 * @typedef {_ContextType<T>} ContextType
 */

/**
 * @typedef {_UnknownContext} UnknownContext
 */

/**
 * @template Value
 * @typedef {_ContextCallback<Value>} ContextCallback
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

/**
 * @template A
 * @typedef {_Observer<A>} Observer
 */

/**
 * @template A
 * @typedef {_ObserverSubscriber<A>} ObserverSubscriber
 */

/**
 * @typedef {Omit<_Service, 'constructor'>} Service
 */

export { bound } from "./bound.js";
export { watch } from "./watch.js";
export { observe } from "./observers.js";
export { property } from "./properties.js";
export { attribute } from "./attributes.js";
export { controller } from "./controller.js";
export { event, listen } from "./events.js";
export { target, targets } from "./targets.js";
export { inject, service, container, InjectRequestEvent } from "./di.js";
export {
  provide,
  consume,
  createContext,
  ContextRequestEvent,
} from "./context.js";
