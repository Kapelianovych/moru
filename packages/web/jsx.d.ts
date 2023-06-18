import { JSX } from "moru";
import { Context, Getter } from "@moru/context";

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

type Event<
  T extends Element,
  E extends globalThis.Event = globalThis.Event
> = E & {
  readonly target: Element;
  readonly currentTarget: T;
};

type EventOf<E extends globalThis.Element, Name> = E extends HTMLElement
  ? Event<E, HTMLElementEventMap[Cast<Name, keyof HTMLElementEventMap>]>
  : E extends SVGElement
  ? Event<E, SVGElementEventMap[Cast<Name, keyof SVGElementEventMap>]>
  : Event<E, globalThis.Event>;

type ElementOf<T extends keyof JSX.IntrinsicElements> =
  T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : T extends keyof SVGElementEventMap
    ? SVGElementEventMap[T]
    : HTMLUnknownElement;

type AttributeLiteral = string | number | bigint | boolean;

type AttributeValue<T extends AttributeLiteral = string> =
  | Mix<T, string, boolean>
  | Getter<Mix<T, string, boolean>>;

type RefAttribute<B> = {
  readonly ref?: B;
};

export type Component<T = {}> = (properties: T, context: Context) => Node;

export type AsyncComponent<T = {}> = (
  properties: T & { readonly fallback?: Node },
  context: Context
) => Promise<Node>;

type BaseNode =
  | null
  | string
  | number
  | bigint
  | boolean
  | undefined
  | globalThis.Node
  | JSX.Element
  | readonly Node[];

export type Node = BaseNode | Getter<BaseNode>;

export type WithChildren<A = {}> = A & {
  readonly children?: Node;
};

declare module "moru" {
  export namespace JSX {
    interface IntrinsicElements {
      // HTML
      readonly a: HTMLAnchorAttributes & EventAttributes<HTMLAnchorElement>;
      readonly abbr: {} & EventAttributes<HTMLElement>;
      readonly address: {} & EventAttributes<HTMLElement>;
      readonly area: HTMLAreaAttributes & EventAttributes<HTMLAreaElement>;
      readonly article: {} & EventAttributes<HTMLElement>;
      readonly aside: {} & EventAttributes<HTMLElement>;
      readonly audio: HTMLAudioAttributes & EventAttributes<HTMLAudioElement>;
      readonly b: {} & EventAttributes<HTMLAnchorElement>;
      readonly base: {} & EventAttributes<HTMLAnchorElement>;
      readonly basefont: {} & EventAttributes<HTMLAnchorElement>;
      readonly bdi: {} & EventAttributes<HTMLAnchorElement>;
      readonly bdo: {} & EventAttributes<HTMLAnchorElement>;
      readonly bgsound: {} & EventAttributes<HTMLAnchorElement>;
      readonly big: {} & EventAttributes<HTMLAnchorElement>;
      readonly blink: {} & EventAttributes<HTMLAnchorElement>;
      readonly blockquote: {} & EventAttributes<HTMLAnchorElement>;
      readonly body: HTMLBodyAttributes & EventAttributes<HTMLBodyElement>;
      readonly br: {} & EventAttributes<HTMLAnchorElement>;
      readonly button: HTMLButtonAttributes &
        EventAttributes<HTMLButtonElement>;
      readonly canvas: {} & EventAttributes<HTMLAnchorElement>;
      readonly caption: {} & EventAttributes<HTMLAnchorElement>;
      readonly center: {} & EventAttributes<HTMLAnchorElement>;
      readonly cite: {} & EventAttributes<HTMLAnchorElement>;
      readonly code: {} & EventAttributes<HTMLAnchorElement>;
      readonly col: {} & EventAttributes<HTMLAnchorElement>;
      readonly colgroup: {} & EventAttributes<HTMLAnchorElement>;
      readonly content: {} & EventAttributes<HTMLAnchorElement>;
      readonly data: {} & EventAttributes<HTMLAnchorElement>;
      readonly datalist: {} & EventAttributes<HTMLAnchorElement>;
      readonly dd: {} & EventAttributes<HTMLAnchorElement>;
      readonly del: {} & EventAttributes<HTMLAnchorElement>;
      readonly details: {} & EventAttributes<HTMLAnchorElement>;
      readonly dfn: {} & EventAttributes<HTMLAnchorElement>;
      readonly dialog: {} & EventAttributes<HTMLAnchorElement>;
      readonly dir: {} & EventAttributes<HTMLAnchorElement>;
      readonly div: HTMLDivAttributes & EventAttributes<HTMLDivElement>;
      readonly dl: {} & EventAttributes<HTMLAnchorElement>;
      readonly dt: {} & EventAttributes<HTMLAnchorElement>;
      readonly em: {} & EventAttributes<HTMLAnchorElement>;
      readonly embed: {} & EventAttributes<HTMLAnchorElement>;
      readonly fieldset: {} & EventAttributes<HTMLAnchorElement>;
      readonly figcaption: {} & EventAttributes<HTMLAnchorElement>;
      readonly figure: {} & EventAttributes<HTMLAnchorElement>;
      readonly font: {} & EventAttributes<HTMLAnchorElement>;
      readonly footer: HTMLFooterAttributes & EventAttributes<HTMLElement>;
      readonly form: {} & EventAttributes<HTMLAnchorElement>;
      readonly frame: {} & EventAttributes<HTMLAnchorElement>;
      readonly frameset: {} & EventAttributes<HTMLAnchorElement>;
      readonly h1: {} & EventAttributes<HTMLAnchorElement>;
      readonly h2: {} & EventAttributes<HTMLAnchorElement>;
      readonly h3: {} & EventAttributes<HTMLAnchorElement>;
      readonly h4: {} & EventAttributes<HTMLAnchorElement>;
      readonly h5: {} & EventAttributes<HTMLAnchorElement>;
      readonly h6: {} & EventAttributes<HTMLAnchorElement>;
      readonly head: HTMLHeadAttributes & EventAttributes<HTMLHeadElement>;
      readonly header: HTMLHeaderAttributes & EventAttributes<HTMLElement>;
      readonly hgroup: {} & EventAttributes<HTMLAnchorElement>;
      readonly hr: {} & EventAttributes<HTMLAnchorElement>;
      readonly html: HTMLHtmlAttributes & EventAttributes<HTMLHtmlElement>;
      readonly i: {} & EventAttributes<HTMLAnchorElement>;
      readonly iframe: {} & EventAttributes<HTMLAnchorElement>;
      readonly img: HTMLImageAttributes & EventAttributes<HTMLAnchorElement>;
      readonly input: HTMLInputAttributes & EventAttributes<HTMLInputElement>;
      readonly ins: {} & EventAttributes<HTMLAnchorElement>;
      readonly kbd: {} & EventAttributes<HTMLAnchorElement>;
      readonly keygen: {} & EventAttributes<HTMLAnchorElement>;
      readonly label: HTMLLabelAttributes & EventAttributes<HTMLAnchorElement>;
      readonly legend: {} & EventAttributes<HTMLAnchorElement>;
      readonly li: {} & EventAttributes<HTMLAnchorElement>;
      readonly link: {} & EventAttributes<HTMLAnchorElement>;
      readonly main: HTMLMainAttributes & EventAttributes<HTMLElement>;
      readonly map: {} & EventAttributes<HTMLAnchorElement>;
      readonly mark: {} & EventAttributes<HTMLAnchorElement>;
      readonly marquee: {} & EventAttributes<HTMLAnchorElement>;
      readonly math: {} & EventAttributes<HTMLAnchorElement>;
      readonly menu: {} & EventAttributes<HTMLAnchorElement>;
      readonly menuitem: {} & EventAttributes<HTMLAnchorElement>;
      readonly meta: HTMLMetaAttributes & EventAttributes<HTMLMetaElement>;
      readonly meter: {} & EventAttributes<HTMLAnchorElement>;
      readonly nav: {} & EventAttributes<HTMLAnchorElement>;
      readonly nobr: {} & EventAttributes<HTMLAnchorElement>;
      readonly noframes: {} & EventAttributes<HTMLAnchorElement>;
      readonly noscript: {} & EventAttributes<HTMLAnchorElement>;
      readonly object: {} & EventAttributes<HTMLAnchorElement>;
      readonly ol: {} & EventAttributes<HTMLAnchorElement>;
      readonly optgroup: {} & EventAttributes<HTMLAnchorElement>;
      readonly option: {} & EventAttributes<HTMLAnchorElement>;
      readonly output: {} & EventAttributes<HTMLAnchorElement>;
      readonly p: HTMLParagraphAttributes &
        EventAttributes<HTMLParagraphElement>;
      readonly param: {} & EventAttributes<HTMLAnchorElement>;
      readonly picture: {} & EventAttributes<HTMLAnchorElement>;
      readonly plaintext: {} & EventAttributes<HTMLAnchorElement>;
      readonly portal: {} & EventAttributes<HTMLAnchorElement>;
      readonly pre: {} & EventAttributes<HTMLAnchorElement>;
      readonly progress: {} & EventAttributes<HTMLAnchorElement>;
      readonly q: {} & EventAttributes<HTMLAnchorElement>;
      readonly rb: {} & EventAttributes<HTMLAnchorElement>;
      readonly rp: {} & EventAttributes<HTMLAnchorElement>;
      readonly rt: {} & EventAttributes<HTMLAnchorElement>;
      readonly rtc: {} & EventAttributes<HTMLAnchorElement>;
      readonly ruby: {} & EventAttributes<HTMLAnchorElement>;
      readonly s: {} & EventAttributes<HTMLAnchorElement>;
      readonly samp: {} & EventAttributes<HTMLAnchorElement>;
      readonly script: {} & EventAttributes<HTMLAnchorElement>;
      readonly section: {} & EventAttributes<HTMLAnchorElement>;
      readonly select: {} & EventAttributes<HTMLAnchorElement>;
      readonly shadow: {} & EventAttributes<HTMLAnchorElement>;
      readonly slot: {} & EventAttributes<HTMLAnchorElement>;
      readonly small: {} & EventAttributes<HTMLAnchorElement>;
      readonly source: {} & EventAttributes<HTMLAnchorElement>;
      readonly spacer: {} & EventAttributes<HTMLAnchorElement>;
      readonly span: {} & EventAttributes<HTMLAnchorElement>;
      readonly strike: {} & EventAttributes<HTMLAnchorElement>;
      readonly strong: {} & EventAttributes<HTMLAnchorElement>;
      readonly style: {} & EventAttributes<HTMLAnchorElement>;
      readonly sub: {} & EventAttributes<HTMLAnchorElement>;
      readonly summary: {} & EventAttributes<HTMLAnchorElement>;
      readonly sup: {} & EventAttributes<HTMLAnchorElement>;
      readonly table: {} & EventAttributes<HTMLAnchorElement>;
      readonly tbody: {} & EventAttributes<HTMLAnchorElement>;
      readonly td: {} & EventAttributes<HTMLAnchorElement>;
      readonly template: {} & EventAttributes<HTMLAnchorElement>;
      readonly textarea: {} & EventAttributes<HTMLAnchorElement>;
      readonly tfoot: {} & EventAttributes<HTMLAnchorElement>;
      readonly th: {} & EventAttributes<HTMLAnchorElement>;
      readonly thead: {} & EventAttributes<HTMLAnchorElement>;
      readonly time: {} & EventAttributes<HTMLAnchorElement>;
      readonly title: HTMLTitleAttributes & EventAttributes<HTMLTitleElement>;
      readonly tr: {} & EventAttributes<HTMLAnchorElement>;
      readonly track: {} & EventAttributes<HTMLAnchorElement>;
      readonly tt: {} & EventAttributes<HTMLAnchorElement>;
      readonly u: {} & EventAttributes<HTMLAnchorElement>;
      readonly ul: {} & EventAttributes<HTMLAnchorElement>;
      readonly var: {} & EventAttributes<HTMLAnchorElement>;
      readonly video: {} & EventAttributes<HTMLAnchorElement>;
      readonly wbr: {} & EventAttributes<HTMLAnchorElement>;
      readonly xmp: {} & EventAttributes<HTMLAnchorElement>;

      // SVG
      readonly svg: {} & EventAttributes<SVGElement>;
      readonly animate: {} & EventAttributes<SVGElement>;
      readonly animateColor: {} & EventAttributes<SVGElement>;
      readonly animateMotion: {} & EventAttributes<SVGElement>;
      readonly animateTransform: {} & EventAttributes<SVGElement>;
      readonly circle: {} & EventAttributes<SVGElement>;
      readonly clipPath: {} & EventAttributes<SVGElement>;
      readonly "color-profile": {} & EventAttributes<SVGElement>;
      readonly defs: {} & EventAttributes<SVGElement>;
      readonly desc: {} & EventAttributes<SVGElement>;
      readonly ellipse: {} & EventAttributes<SVGElement>;
      readonly feBlend: {} & EventAttributes<SVGElement>;
      readonly feColorMatrix: {} & EventAttributes<SVGElement>;
      readonly feComponentTransfer: {} & EventAttributes<SVGElement>;
      readonly feComposite: {} & EventAttributes<SVGElement>;
      readonly feConvolveMatrix: {} & EventAttributes<SVGElement>;
      readonly feDiffuseLighting: {} & EventAttributes<SVGElement>;
      readonly feDisplacementMap: {} & EventAttributes<SVGElement>;
      readonly feDistantLight: {} & EventAttributes<SVGElement>;
      readonly feFlood: {} & EventAttributes<SVGElement>;
      readonly feFuncA: {} & EventAttributes<SVGElement>;
      readonly feFuncB: {} & EventAttributes<SVGElement>;
      readonly feFuncG: {} & EventAttributes<SVGElement>;
      readonly feFuncR: {} & EventAttributes<SVGElement>;
      readonly feGaussianBlur: {} & EventAttributes<SVGElement>;
      readonly feImage: {} & EventAttributes<SVGElement>;
      readonly feMerge: {} & EventAttributes<SVGElement>;
      readonly feMergeNode: {} & EventAttributes<SVGElement>;
      readonly feMorphology: {} & EventAttributes<SVGElement>;
      readonly feOffset: {} & EventAttributes<SVGElement>;
      readonly fePointLight: {} & EventAttributes<SVGElement>;
      readonly feSpecularLighting: {} & EventAttributes<SVGElement>;
      readonly feSpotLight: {} & EventAttributes<SVGElement>;
      readonly feTile: {} & EventAttributes<SVGElement>;
      readonly feTurbulence: {} & EventAttributes<SVGElement>;
      readonly filter: {} & EventAttributes<SVGElement>;
      readonly foreignObject: {} & EventAttributes<SVGElement>;
      readonly g: {} & EventAttributes<SVGElement>;
      readonly image: {} & EventAttributes<SVGElement>;
      readonly line: {} & EventAttributes<SVGElement>;
      readonly linearGradient: {} & EventAttributes<SVGElement>;
      readonly marker: {} & EventAttributes<SVGElement>;
      readonly mask: {} & EventAttributes<SVGElement>;
      readonly metadata: {} & EventAttributes<SVGElement>;
      readonly mpath: {} & EventAttributes<SVGElement>;
      readonly path: {} & EventAttributes<SVGElement>;
      readonly pattern: {} & EventAttributes<SVGElement>;
      readonly polygon: {} & EventAttributes<SVGElement>;
      readonly polyline: {} & EventAttributes<SVGElement>;
      readonly radialGradient: {} & EventAttributes<SVGElement>;
      readonly rect: {} & EventAttributes<SVGElement>;
      readonly set: {} & EventAttributes<SVGElement>;
      readonly stop: {} & EventAttributes<SVGElement>;
      readonly switch: {} & EventAttributes<SVGElement>;
      readonly symbol: {} & EventAttributes<SVGElement>;
      readonly text: {} & EventAttributes<SVGElement>;
      readonly textPath: {} & EventAttributes<SVGElement>;
      readonly tspan: {} & EventAttributes<SVGElement>;
      readonly use: {} & EventAttributes<SVGElement>;
      readonly view: {} & EventAttributes<SVGElement>;
    }

    interface AriaAttributes {
      readonly role?: AttributeValue<string>;
    }

    interface CommonAttributes<E extends globalThis.Element>
      extends RefAttribute<E>,
        AriaAttributes {
      readonly accesskey?: AttributeValue<string>;
      readonly autocapitalize?: AttributeValue<
        "off" | "none" | "on" | "sentences" | "words" | "characters"
      >;
      readonly autofocus?: AttributeValue<boolean>;
      readonly class?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly contenteditable?: AttributeValue<boolean | "true" | "false">;
      readonly [key: `data-${string}`]: AttributeValue;
      readonly dir?: AttributeValue<"ltr" | "rtl" | "auto">;
      readonly draggable?: AttributeValue<"true" | "false">;
      readonly enterkeyhint?: AttributeValue<
        "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
      >;
      readonly exportparts?: AttributeValue<string>;
      readonly hidden?: AttributeValue<boolean>;
      readonly id?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly inputmode?: AttributeValue<
        | "none"
        | "text"
        | "decimal"
        | "numeric"
        | "tel"
        | "search"
        | "email"
        | "url"
      >;
      readonly is?: AttributeValue<string>;
      readonly itemid?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly itemprop?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly itemref?: AttributeValue<string>;
      readonly itemscope?: AttributeValue<boolean>;
      readonly itemtype?: AttributeValue<string>;
      readonly lang?: AttributeValue<string>;
      readonly nonce?: AttributeValue<string>;
      readonly part?: AttributeValue<string>;
      readonly slot?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly spellcheck?: AttributeValue<boolean | "true" | "false">;
      readonly style?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly tabindex?: AttributeValue<number | bigint>;
      readonly title?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly translate?: AttributeValue<boolean | "yes" | "no">;
    }

    type Target = "_self" | "_blank" | "_parent" | "_top";

    interface HTMLAnchorAttributes
      extends WithChildren,
        CommonAttributes<HTMLAnchorElement> {
      readonly href: AttributeValue<string>;
      readonly target?: AttributeValue<Target>;
      readonly download?: AttributeValue<
        Exclude<AttributeLiteral, number | bigint>
      >;
      readonly hreflang?: AttributeValue<string>;
      readonly ping?: AttributeValue<string>;
      readonly referrerpolicy?: AttributeValue<ReferrerPolicy>;
      // TODO: Describe and set explicit values of the link types.
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
      readonly rel?: AttributeValue<string>;
      readonly type?: AttributeValue<string>;
    }

    interface HTMLAreaAttributes extends CommonAttributes<HTMLAreaElement> {
      readonly alt?: AttributeValue<string>;
      readonly coords?: AttributeValue<
        | `${number},${number},${number}`
        | `${number},${number},${number},${number}`
        | string
      >;
      readonly download?: AttributeValue<
        Exclude<AttributeLiteral, number | bigint>
      >;
      readonly href?: AttributeValue<string>;
      readonly ping?: AttributeValue<string>;
      readonly referrerpolicy?: AttributeValue<ReferrerPolicy>;
      readonly rel?: AttributeValue<string>;
      readonly shape?: AttributeValue<"rect" | "circle" | "poly" | "default">;
      readonly target?: AttributeValue<Target>;
    }

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

    type FormEncType =
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "text/plain";

    interface HTMLInputAttributes extends CommonAttributes<HTMLInputElement> {
      readonly accept?: AttributeValue<string>;
      readonly alt?: AttributeValue<string>;
      readonly autocomplete?: AttributeValue<string>;
      readonly autofocus?: AttributeValue<boolean>;
      readonly capture?: AttributeValue<"user" | "environment">;
      readonly checked?: AttributeValue<boolean>;
      readonly dirname?: AttributeValue<string>;
      readonly disabled?: AttributeValue<boolean>;
      readonly form?: AttributeValue<string>;
      readonly formaction?: AttributeValue<string>;
      readonly formenctype?: AttributeValue<FormEncType>;
      readonly formmethod?: AttributeValue<"get" | "post" | "dialog">;
      readonly formnovalidate?: AttributeValue<boolean>;
      readonly formtarget?: AttributeValue<Target>;
      readonly height?: AttributeValue<number | bigint>;
      readonly inputmode?: AttributeValue<
        | "none"
        | "text"
        | "tel"
        | "url"
        | "email"
        | "numeric"
        | "decimal"
        | "search"
      >;
      readonly list?: AttributeValue<string>;
      readonly max?: AttributeValue<number | bigint>;
      readonly min?: AttributeValue<number | bigint>;
      readonly maxlength?: AttributeValue<number | bigint>;
      readonly minlength?: AttributeValue<number | bigint>;
      readonly multiple?: AttributeValue<boolean>;
      readonly name?: AttributeValue<string>;
      readonly pattern?: AttributeValue<string>;
      readonly placeholder?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly readonly?: AttributeValue<boolean>;
      readonly required?: AttributeValue<boolean>;
      readonly size?: AttributeValue<number | bigint>;
      readonly src?: AttributeValue<string>;
      readonly step?: AttributeValue<"any" | number | bigint>;
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
      readonly value?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly width?: AttributeValue<number | bigint>;
    }

    interface HTMLImageAttributes extends CommonAttributes<HTMLImageElement> {
      readonly alt: AttributeValue<string>;
      readonly crossorigin?: AttributeValue<Crossorigin>;
      readonly decoding?: AttributeValue<"sync" | "async" | "auto">;
      readonly fetchpriority?: AttributeValue<"high" | "low" | "auto">;
      readonly height?: AttributeValue<number>;
      readonly ismap?: AttributeValue<boolean>;
      readonly loading?: AttributeValue<"eager" | "lazy">;
      readonly referrerpolicy?: AttributeValue<ReferrerPolicy>;
      readonly sizes?: AttributeValue<string>;
      readonly src: AttributeValue<string>;
      readonly srcset?: AttributeValue<string>;
      readonly width?: AttributeValue<number>;
      readonly usemap?: AttributeValue<string>;
    }

    interface HTMLLabelAttributes
      extends WithChildren,
        CommonAttributes<HTMLLabelElement> {
      readonly for: AttributeValue<Exclude<AttributeLiteral, boolean>>;
    }

    interface HTMLDivAttributes
      extends WithChildren,
        CommonAttributes<HTMLDivElement> {}

    interface HTMLHeaderAttributes
      extends WithChildren,
        CommonAttributes<HTMLElement> {}

    interface HTMLButtonAttributes
      extends WithChildren,
        CommonAttributes<HTMLButtonElement> {
      readonly autofocus?: AttributeValue<boolean>;
      readonly disabled?: AttributeValue<boolean>;
      readonly form?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly formaction?: AttributeValue<string>;
      readonly formenctype?: AttributeValue<FormEncType>;
      readonly formmethod?: AttributeValue<"get" | "post">;
      readonly formnovalidate?: AttributeValue<boolean>;
      readonly formtarget?: AttributeValue<Target>;
      readonly name?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly popovertarget?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      readonly popovertargetaction?: AttributeValue<"hide" | "show" | "toggle">;
      readonly type?: AttributeValue<"submit" | "reset" | "button">;
      readonly value?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
    }

    interface HTMLMainAttributes
      extends WithChildren,
        CommonAttributes<HTMLElement> {}

    interface HTMLFooterAttributes
      extends WithChildren,
        CommonAttributes<HTMLElement> {}

    interface HTMLParagraphAttributes
      extends WithChildren,
        CommonAttributes<HTMLParagraphElement> {}

    interface HTMLHtmlAttributes
      extends WithChildren,
        CommonAttributes<HTMLHtmlElement> {
      readonly lang?: AttributeValue<string>;
      readonly xmlns?: AttributeValue<string>;
    }

    interface HTMLHeadAttributes
      extends WithChildren,
        CommonAttributes<HTMLHeadElement> {}

    interface HTMLTitleAttributes
      extends WithChildren,
        CommonAttributes<HTMLTitleElement> {}

    interface HTMLMetaAttributes
      extends WithChildren,
        CommonAttributes<HTMLMetaElement> {
      readonly charset?: AttributeValue<string>;
      // TODO: improve content values depending on the name or http-equiv attribute.
      readonly content?: AttributeValue<string>;
      readonly "http-equiv"?: AttributeValue<
        | "content-security-policy"
        | "content-type"
        | "default-style"
        | "x-ua-compatible"
        | "refresh"
      >;
      readonly name?: AttributeValue<
        | "application-name"
        | "author"
        | "description"
        | "generator"
        | "keywords"
        | "referrer"
        | "theme-color"
        | "color-scheme"
        | "viewport"
        // Extended
        | "creator"
        | "publisher"
        | "robots"
      >;
    }

    interface HTMLBodyAttributes
      extends WithChildren,
        CommonAttributes<HTMLBodyElement> {}
  }
}

type EventAttributes<T extends globalThis.Element> = {
  readonly [K in keyof T as K extends `on${infer Name}`
    ? `on${Name}` | `on${Capitalize<Name>}${"" | EventListenerModifiers}`
    : never]?: (event: EventOf<T, Replace<K, "on", "">>) => void;
};
