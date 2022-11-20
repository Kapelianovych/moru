type Replace<
  O,
  P extends string,
  F extends string
> = O extends `${infer A}${P}${infer B}` ? Replace<`${A}${F}${B}`, P, F> : O;

type Cast<A, B> = A extends B ? A : B;

type Mix<To, What, IfNot> = IfNot extends To ? To : To | What;

type EventListenerModifiers =
  | "Once"
  | "Capture"
  | "Passive"
  | "NoPassive"
  | "OnceCapture"
  | "OncePassive"
  | "OnceNoPassive"
  | "CapturePassive"
  | "CaptureNoPassive"
  | "OnceCapturePassive"
  | "OnceCaptureNoPassive";

declare global {
  namespace JSX {
    type Element =
      | null
      | undefined
      | string
      | number
      | bigint
      | boolean
      | globalThis.Node
      | readonly Element[]
      | (() => Element);

    type Event<
      T extends globalThis.Element,
      E extends globalThis.Event = globalThis.Event
    > = E & {
      readonly currentTarget: T;
    };

    type EventOf<E extends globalThis.Element, Name> = E extends HTMLElement
      ? HTMLElementEventMap[Cast<Name, keyof HTMLElementEventMap>]
      : E extends SVGElement
      ? SVGElementEventMap[Cast<Name, keyof SVGElementEventMap>]
      : globalThis.Event;

    type EventsOf<T extends globalThis.Element> = {
      readonly [K in keyof T as K extends `on${infer Name}`
        ? `on${Name}` | `on${Capitalize<Name>}${"" | EventListenerModifiers}`
        : never]: (event: Event<T, EventOf<T, Replace<K, "on", "">>>) => void;
    };

    type ElementOf<T extends keyof ElementAttributesMap> =
      T extends keyof HTMLElementTagNameMap
        ? HTMLElementTagNameMap[T]
        : T extends keyof SVGElementEventMap
        ? SVGElementEventMap[T]
        : HTMLUnknownElement;

    type AttributesOf<T extends keyof ElementAttributesMap> = AriaAttributes &
      CommonAttributes &
      ElementAttributesMap[T] &
      EventsOf<ElementOf<T>> &
      RefAttribute<ElementOf<T>>;

    type AttributeLiteral = string | number | bigint | boolean;

    type AttributeValue<T extends AttributeLiteral = string> =
      | Mix<T, string, boolean>
      | (() => Mix<T, string, boolean>);

    type AriaAttributes = {
      readonly role: AttributeValue<string>;
    };

    type CommonAttributes = {
      readonly accesskey: AttributeValue<string>;
      readonly autocapitalize: AttributeValue<
        "off" | "none" | "on" | "sentences" | "words" | "characters"
      >;
      readonly autofocus: AttributeValue<boolean>;
      readonly class:
        | AttributeValue<Exclude<AttributeLiteral, boolean>>
        | readonly (
            | Exclude<AttributeLiteral, boolean>
            | Record<string, AttributeValue<boolean>>
          )[];
      readonly contenteditable: AttributeValue<boolean | "true" | "false">;
      readonly [key: `data-${string}`]: AttributeValue;
      readonly dir: AttributeValue<"ltr" | "rtl" | "auto">;
      readonly draggable: AttributeValue<"true" | "false">;
      readonly enterkeyhint: AttributeValue<
        "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
      >;
      readonly exportparts: AttributeValue<string>;
      readonly hidden: AttributeValue<boolean>;
      readonly id: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly inputmode: AttributeValue<
        | "none"
        | "text"
        | "decimal"
        | "numeric"
        | "tel"
        | "search"
        | "email"
        | "url"
      >;
      readonly is: AttributeValue<string>;
      readonly itemid: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly itemprop: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly itemref: AttributeValue<string>;
      readonly itemscope: AttributeValue<boolean>;
      readonly itemtype: AttributeValue<string>;
      readonly lang: AttributeValue<string>;
      readonly nonce: AttributeValue<string>;
      readonly part: AttributeValue<string>;
      readonly slot: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly spellcheck: AttributeValue<boolean | "true" | "false">;
      readonly style:
        | AttributeValue<Exclude<AttributeLiteral, boolean>>
        | Record<string, AttributeValue<Exclude<AttributeLiteral, boolean>>>;
      readonly tabindex: AttributeValue<number | bigint>;
      readonly title: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly translate: AttributeValue<boolean | "yes" | "no">;
    };

    type RefAttribute<E extends globalThis.Element> = {
      readonly ref: (value: E) => void;
    };

    type LinkTarget = "_self" | "_blank" | "_parent" | "_top";

    type HTMLAnchorAttributes = {
      readonly href: AttributeValue<string>;
      readonly target: AttributeValue<LinkTarget>;
      readonly download: AttributeValue<
        Exclude<AttributeLiteral, number | bigint>
      >;
      readonly hreflang: AttributeValue<string>;
      readonly ping: AttributeValue<string>;
      readonly referrerpolicy: AttributeValue<ReferrerPolicy>;
      // TODO: Describe and set explicit values of the link types.
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
      readonly rel: AttributeValue<string>;
      readonly type: AttributeValue<string>;
    };

    type HTMLAreaAttributes = {
      readonly alt: AttributeValue<string>;
      readonly coords: AttributeValue<
        | `${number},${number},${number}`
        | `${number},${number},${number},${number}`
        | string
      >;
      readonly download: AttributeValue<
        Exclude<AttributeLiteral, number | bigint>
      >;
      readonly href: AttributeValue<string>;
      readonly ping: AttributeValue<string>;
      readonly referrerpolicy: AttributeValue<ReferrerPolicy>;
      readonly rel: AttributeValue<string>;
      readonly shape: AttributeValue<"rect" | "circle" | "poly" | "default">;
      readonly target: AttributeValue<LinkTarget>;
    };

    type Crossorigin = "anonymous" | "use-credentials";

    type HTMLAudioAttributes = {
      readonly autoplay: AttributeValue<boolean>;
      readonly controls: AttributeValue<boolean>;
      readonly controlslist: AttributeValue<
        "nodownload" | "nofullscreen" | "noremoteplayback"
      >;
      readonly crossorigin: AttributeValue<Crossorigin>;
      readonly disableremoteplayback: AttributeValue<boolean>;
      readonly loop: AttributeValue<boolean>;
      readonly muted: AttributeValue<boolean>;
      readonly preload: AttributeValue<"none" | "metadata" | "auto">;
      readonly src: AttributeValue<string>;
    };

    type HTMLInputAttributes = {
      readonly accept: AttributeValue<string>;
      readonly alt: AttributeValue<string>;
      readonly autocomplete: AttributeValue<string>;
      readonly autofocus: AttributeValue<boolean>;
      readonly capture: AttributeValue<"user" | "environment">;
      readonly checked: AttributeValue<boolean>;
      readonly dirname: AttributeValue<string>;
      readonly disabled: AttributeValue<boolean>;
      readonly form: AttributeValue<string>;
      readonly formaction: AttributeValue<string>;
      readonly formenctype: AttributeValue<
        | "application/x-www-form-urlencoded"
        | "multipart/form-data"
        | "text/plain"
      >;
      readonly formmethod: AttributeValue<"get" | "post" | "dialog">;
      readonly formnovalidate: AttributeValue<boolean>;
      readonly formtarget: AttributeValue<LinkTarget>;
      readonly height: AttributeValue<number | bigint>;
      readonly inputmode: AttributeValue<
        | "none"
        | "text"
        | "tel"
        | "url"
        | "email"
        | "numeric"
        | "decimal"
        | "search"
      >;
      readonly list: AttributeValue<string>;
      readonly max: AttributeValue<number | bigint>;
      readonly min: AttributeValue<number | bigint>;
      readonly maxlength: AttributeValue<number | bigint>;
      readonly minlength: AttributeValue<number | bigint>;
      readonly multiple: AttributeValue<boolean>;
      readonly name: AttributeValue<string>;
      readonly pattern: AttributeValue<string>;
      readonly placeholder: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly readonly: AttributeValue<boolean>;
      readonly required: AttributeValue<boolean>;
      readonly size: AttributeValue<number | bigint>;
      readonly src: AttributeValue<string>;
      readonly step: AttributeValue<"any" | number | bigint>;
      readonly type: AttributeValue<
        | "button"
        | "checkbox"
        | "color"
        | "date"
        | "datetime-local"
        | "email"
        | "file"
        | "hidden"
        | "image"
        | "month"
        | "number"
        | "password"
        | "radio"
        | "range"
        | "reset"
        | "search"
        | "submit"
        | "tel"
        | "text"
        | "time"
        | "url"
        | "week"
      >;
      readonly value: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly width: AttributeValue<number | bigint>;
    };

    type HTMLImageAttributes = {
      readonly alt: AttributeValue<string>;
      readonly crossorigin: AttributeValue<Crossorigin>;
      readonly decoding: AttributeValue<"sync" | "async" | "auto">;
      readonly fetchpriority: AttributeValue<"high" | "low" | "auto">;
      readonly height: AttributeValue<number>;
      readonly ismap: AttributeValue<boolean>;
      readonly loading: AttributeValue<"eager" | "lazy">;
      readonly referrerpolicy: AttributeValue<ReferrerPolicy>;
      readonly sizes: AttributeValue<string>;
      readonly src: AttributeValue<string>;
      readonly srcset: AttributeValue<string>;
      readonly width: AttributeValue<number>;
      readonly usemap: AttributeValue<string>;
    };

    type HTMLLabelAttributes = {
      readonly for: AttributeValue<Exclude<AttributeLiteral, boolean>>;
    };

    interface ElementAttributesMap {
      // HTML
      readonly a: WithChildren<HTMLAnchorAttributes>;
      readonly abbr: WithChildren<{}>;
      readonly address: WithChildren<{}>;
      readonly area: HTMLAreaAttributes;
      readonly article: WithChildren<{}>;
      readonly aside: WithChildren<{}>;
      readonly audio: HTMLAudioAttributes;
      readonly b: WithChildren<{}>;
      readonly base: WithChildren<{}>;
      readonly basefont: WithChildren<{}>;
      readonly bdi: WithChildren<{}>;
      readonly bdo: WithChildren<{}>;
      readonly bgsound: WithChildren<{}>;
      readonly big: WithChildren<{}>;
      readonly blink: WithChildren<{}>;
      readonly blockquote: WithChildren<{}>;
      readonly body: WithChildren<{}>;
      readonly br: WithChildren<{}>;
      readonly button: WithChildren<{}>;
      readonly canvas: WithChildren<{}>;
      readonly caption: WithChildren<{}>;
      readonly center: WithChildren<{}>;
      readonly cite: WithChildren<{}>;
      readonly code: WithChildren<{}>;
      readonly col: WithChildren<{}>;
      readonly colgroup: WithChildren<{}>;
      readonly content: WithChildren<{}>;
      readonly data: WithChildren<{}>;
      readonly datalist: WithChildren<{}>;
      readonly dd: WithChildren<{}>;
      readonly del: WithChildren<{}>;
      readonly details: WithChildren<{}>;
      readonly dfn: WithChildren<{}>;
      readonly dialog: WithChildren<{}>;
      readonly dir: WithChildren<{}>;
      readonly div: WithChildren<{}>;
      readonly dl: WithChildren<{}>;
      readonly dt: WithChildren<{}>;
      readonly em: WithChildren<{}>;
      readonly embed: WithChildren<{}>;
      readonly fieldset: WithChildren<{}>;
      readonly figcaption: WithChildren<{}>;
      readonly figure: WithChildren<{}>;
      readonly font: WithChildren<{}>;
      readonly footer: WithChildren<{}>;
      readonly form: WithChildren<{}>;
      readonly frame: WithChildren<{}>;
      readonly frameset: WithChildren<{}>;
      readonly h1: WithChildren<{}>;
      readonly h2: WithChildren<{}>;
      readonly h3: WithChildren<{}>;
      readonly h4: WithChildren<{}>;
      readonly h5: WithChildren<{}>;
      readonly h6: WithChildren<{}>;
      readonly head: WithChildren<{}>;
      readonly header: WithChildren<{}>;
      readonly hgroup: WithChildren<{}>;
      readonly hr: WithChildren<{}>;
      readonly html: WithChildren<{}>;
      readonly i: WithChildren<{}>;
      readonly iframe: WithChildren<{}>;
      readonly img: HTMLImageAttributes;
      readonly input: HTMLInputAttributes;
      readonly ins: WithChildren<{}>;
      readonly kbd: WithChildren<{}>;
      readonly keygen: WithChildren<{}>;
      readonly label: WithChildren<HTMLLabelAttributes>;
      readonly legend: WithChildren<{}>;
      readonly li: WithChildren<{}>;
      readonly link: {};
      readonly main: WithChildren<{}>;
      readonly map: WithChildren<{}>;
      readonly mark: WithChildren<{}>;
      readonly marquee: WithChildren<{}>;
      readonly math: WithChildren<{}>;
      readonly menu: WithChildren<{}>;
      readonly menuitem: WithChildren<{}>;
      readonly meta: {};
      readonly meter: WithChildren<{}>;
      readonly nav: WithChildren<{}>;
      readonly nobr: WithChildren<{}>;
      readonly noframes: WithChildren<{}>;
      readonly noscript: WithChildren<{}>;
      readonly object: WithChildren<{}>;
      readonly ol: WithChildren<{}>;
      readonly optgroup: WithChildren<{}>;
      readonly option: WithChildren<{}>;
      readonly output: WithChildren<{}>;
      readonly p: WithChildren<{}>;
      readonly param: WithChildren<{}>;
      readonly picture: WithChildren<{}>;
      readonly plaintext: WithChildren<{}>;
      readonly portal: WithChildren<{}>;
      readonly pre: WithChildren<{}>;
      readonly progress: WithChildren<{}>;
      readonly q: WithChildren<{}>;
      readonly rb: WithChildren<{}>;
      readonly rp: WithChildren<{}>;
      readonly rt: WithChildren<{}>;
      readonly rtc: WithChildren<{}>;
      readonly ruby: WithChildren<{}>;
      readonly s: WithChildren<{}>;
      readonly samp: WithChildren<{}>;
      readonly script: WithChildren<{}>;
      readonly section: WithChildren<{}>;
      readonly select: WithChildren<{}>;
      readonly shadow: WithChildren<{}>;
      readonly slot: WithChildren<{}>;
      readonly small: WithChildren<{}>;
      readonly source: {};
      readonly spacer: WithChildren<{}>;
      readonly span: WithChildren<{}>;
      readonly strike: WithChildren<{}>;
      readonly strong: WithChildren<{}>;
      readonly style: WithChildren<{}>;
      readonly sub: WithChildren<{}>;
      readonly summary: WithChildren<{}>;
      readonly sup: WithChildren<{}>;
      readonly table: WithChildren<{}>;
      readonly tbody: WithChildren<{}>;
      readonly td: WithChildren<{}>;
      readonly template: WithChildren<{}>;
      readonly textarea: WithChildren<{}>;
      readonly tfoot: WithChildren<{}>;
      readonly th: WithChildren<{}>;
      readonly thead: WithChildren<{}>;
      readonly time: WithChildren<{}>;
      readonly title: WithChildren<{}>;
      readonly tr: WithChildren<{}>;
      readonly track: WithChildren<{}>;
      readonly tt: WithChildren<{}>;
      readonly u: WithChildren<{}>;
      readonly ul: WithChildren<{}>;
      readonly var: WithChildren<{}>;
      readonly video: WithChildren<{}>;
      readonly wbr: WithChildren<{}>;
      readonly xmp: WithChildren<{}>;

      // SVG
      readonly svg: WithChildren<{}>;
      readonly animate: WithChildren<{}>;
      readonly animateColor: WithChildren<{}>;
      readonly animateMotion: WithChildren<{}>;
      readonly animateTransform: WithChildren<{}>;
      readonly circle: WithChildren<{}>;
      readonly clipPath: WithChildren<{}>;
      readonly "color-profile": WithChildren<{}>;
      readonly defs: WithChildren<{}>;
      readonly desc: WithChildren<{}>;
      readonly ellipse: WithChildren<{}>;
      readonly feBlend: WithChildren<{}>;
      readonly feColorMatrix: WithChildren<{}>;
      readonly feComponentTransfer: WithChildren<{}>;
      readonly feComposite: WithChildren<{}>;
      readonly feConvolveMatrix: WithChildren<{}>;
      readonly feDiffuseLighting: WithChildren<{}>;
      readonly feDisplacementMap: WithChildren<{}>;
      readonly feDistantLight: WithChildren<{}>;
      readonly feFlood: WithChildren<{}>;
      readonly feFuncA: WithChildren<{}>;
      readonly feFuncB: WithChildren<{}>;
      readonly feFuncG: WithChildren<{}>;
      readonly feFuncR: WithChildren<{}>;
      readonly feGaussianBlur: WithChildren<{}>;
      readonly feImage: WithChildren<{}>;
      readonly feMerge: WithChildren<{}>;
      readonly feMergeNode: WithChildren<{}>;
      readonly feMorphology: WithChildren<{}>;
      readonly feOffset: WithChildren<{}>;
      readonly fePointLight: WithChildren<{}>;
      readonly feSpecularLighting: WithChildren<{}>;
      readonly feSpotLight: WithChildren<{}>;
      readonly feTile: WithChildren<{}>;
      readonly feTurbulence: WithChildren<{}>;
      readonly filter: WithChildren<{}>;
      readonly foreignObject: WithChildren<{}>;
      readonly g: WithChildren<{}>;
      readonly image: WithChildren<{}>;
      readonly line: WithChildren<{}>;
      readonly linearGradient: WithChildren<{}>;
      readonly marker: WithChildren<{}>;
      readonly mask: WithChildren<{}>;
      readonly metadata: WithChildren<{}>;
      readonly mpath: WithChildren<{}>;
      readonly path: WithChildren<{}>;
      readonly pattern: WithChildren<{}>;
      readonly polygon: WithChildren<{}>;
      readonly polyline: WithChildren<{}>;
      readonly radialGradient: WithChildren<{}>;
      readonly rect: WithChildren<{}>;
      readonly set: WithChildren<{}>;
      readonly stop: WithChildren<{}>;
      readonly switch: WithChildren<{}>;
      readonly symbol: WithChildren<{}>;
      readonly text: WithChildren<{}>;
      readonly textPath: WithChildren<{}>;
      readonly tspan: WithChildren<{}>;
      readonly use: WithChildren<{}>;
      readonly view: WithChildren<{}>;
    }

    type IntrinsicAttributes = {};

    type ElementChildrenAttribute = Partial<WithChildren<{}>>;

    type IntrinsicElements = {
      readonly [K in keyof ElementAttributesMap]: Partial<AttributesOf<K>>;
    };
  }
}

export type Component<Properties = void> = (
  properties: Properties
) => JSX.Element;

export function element(
  tag: string | Component,
  properties: Record<string, any>,
  ...children: readonly JSX.Element[]
): JSX.Element;

export function Fragment(properties: WithChildren<{}>): DocumentFragment;

export type WithChildren<Properties> = Properties & {
  readonly children: JSX.Element;
};

export type StateGetter<T> = {
  (): T;
  readonly raw: T;
};

export type StateSetterOptions = {
  readonly immediate?: boolean;
};

export type StateSetter<T> = {
  (value: T, options?: StateSetterOptions): void;
  (fn: (old: T) => T, options?: StateSetterOptions): void;
};

export type UseStateOptions<T> = {
  readonly equals?: (previous: T, next: T) => boolean;
};

export function useState<T>(
  value: T,
  options?: UseStateOptions<T>
): readonly [StateGetter<T>, StateSetter<T>];

export function useEffect(callback: () => void | VoidFunction): void;

export type UseMemoOptions<T> = {
  readonly equals?: (previous: T | undefined, next: T) => boolean;
};

export function useMemo<T>(
  callback: (previous: T | undefined) => T,
  options?: UseMemoOptions<T>
): StateGetter<T>;
