/**
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

export { Bound } from "./bound.js";
export { Watch } from "./watch.js";
export { Target } from "./targets.js";
export { Observe } from "./observers.js";
export { Property } from "./properties.js";
export { Attribute } from "./attributes.js";
export { Controller } from "./controller.js";
export { Event, Listen } from "./events.js";
export { Inject, Injectable, InjectRequestEvent } from "./container.js";
export {
  Provide,
  Consume,
  createContext,
  ContextRequestEvent,
} from "./context.js";
