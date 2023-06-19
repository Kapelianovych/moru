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
      // HTML + SVG
      readonly a:
        | (HTMLAnchorAttributes &
            EventAttributes<HTMLAnchorElement> &
            IntrinsicProperties<HTMLAnchorElement>)
        | (SVGAnchorAttributes &
            EventAttributes<SVGElement> &
            IntrinsicProperties<SVGElement>);

      // HTML
      readonly abbr: {} & EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly address: {} & EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly area: HTMLAreaAttributes &
        EventAttributes<HTMLAreaElement> &
        IntrinsicProperties<HTMLElement>;
      readonly article: {} & EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly aside: {} & EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly audio: HTMLAudioAttributes &
        EventAttributes<HTMLAudioElement> &
        IntrinsicProperties<HTMLElement>;
      readonly b: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly base: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly basefont: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly bdi: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly bdo: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly bgsound: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly big: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly blink: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly blockquote: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly body: HTMLBodyAttributes &
        EventAttributes<HTMLBodyElement> &
        IntrinsicProperties<HTMLElement>;
      readonly br: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly button: HTMLButtonAttributes &
        EventAttributes<HTMLButtonElement> &
        IntrinsicProperties<HTMLElement>;
      readonly canvas: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly caption: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly center: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly cite: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly code: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly col: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly colgroup: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly content: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly data: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly datalist: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly dd: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly del: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly details: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly dfn: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly dialog: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly dir: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly div: HTMLDivAttributes &
        EventAttributes<HTMLDivElement> &
        IntrinsicProperties<HTMLElement>;
      readonly dl: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly dt: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly em: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly embed: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly fieldset: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly figcaption: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly figure: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly font: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly footer: HTMLFooterAttributes &
        EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly form: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly frame: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly frameset: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly h1: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly h2: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly h3: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly h4: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly h5: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly h6: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly head: HTMLHeadAttributes &
        EventAttributes<HTMLHeadElement> &
        IntrinsicProperties<HTMLElement>;
      readonly header: HTMLHeaderAttributes &
        EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly hgroup: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly hr: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly html: HTMLHtmlAttributes &
        EventAttributes<HTMLHtmlElement> &
        IntrinsicProperties<HTMLElement>;
      readonly i: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly iframe: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly img: HTMLImageAttributes &
        EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly input: HTMLInputAttributes &
        EventAttributes<HTMLInputElement> &
        IntrinsicProperties<HTMLInputElement>;
      readonly ins: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly kbd: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly keygen: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly label: HTMLLabelAttributes &
        EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly legend: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly li: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly link: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly main: HTMLMainAttributes &
        EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly map: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly mark: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly marquee: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly math: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly menu: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly menuitem: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly meta: HTMLMetaAttributes &
        EventAttributes<HTMLMetaElement> &
        IntrinsicProperties<HTMLElement>;
      readonly meter: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly nav: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly nobr: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly noframes: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly noscript: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly object: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly ol: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly optgroup: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly option: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly output: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly p: HTMLParagraphAttributes &
        EventAttributes<HTMLParagraphElement> &
        IntrinsicProperties<HTMLElement>;
      readonly param: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly picture: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly plaintext: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly portal: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly pre: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly progress: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly q: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly rb: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly rp: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly rt: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly rtc: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly ruby: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly s: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly samp: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly script: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly section: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly select: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly shadow: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly slot: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly small: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly source: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly spacer: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly span: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly strike: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly strong: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly style: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly sub: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly summary: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly sup: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly table: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly tbody: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly td: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly template: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly textarea: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly tfoot: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly th: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly thead: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly time: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly title: HTMLTitleAttributes &
        EventAttributes<HTMLTitleElement> &
        IntrinsicProperties<HTMLElement>;
      readonly tr: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly track: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly tt: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly u: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly ul: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly var: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly video: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly wbr: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly xmp: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;

      // SVG
      readonly svg: SVGSVGAttributes & EventAttributes<SVGSVGElement> &
        IntrinsicProperties<SVGSVGElement>;
      readonly animate: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly animateColor: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly animateMotion: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly animateTransform: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly circle: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly clipPath: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly "color-profile": {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly defs: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly desc: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly ellipse: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feBlend: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feColorMatrix: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feComponentTransfer: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feComposite: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feConvolveMatrix: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feDiffuseLighting: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feDisplacementMap: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feDistantLight: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feFlood: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feFuncA: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feFuncB: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feFuncG: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feFuncR: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feGaussianBlur: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feImage: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feMerge: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feMergeNode: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feMorphology: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feOffset: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly fePointLight: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feSpecularLighting: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feSpotLight: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feTile: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly feTurbulence: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly filter: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly foreignObject: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly g: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly image: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly line: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly linearGradient: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly marker: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly mask: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly metadata: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly mpath: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly path: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly pattern: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly polygon: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly polyline: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly radialGradient: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly rect: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly set: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly stop: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly switch: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly symbol: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly text: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly textPath: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly tspan: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly use: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly view: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
    }

    type IntrinsicProperties<E extends globalThis.Element> = {
      readonly [K in keyof E as K extends string ? `prop:${K}` : never]?:
        | E[K]
        | Getter<E[K]>;
    };

    interface CustomAttributes<B extends globalThis.Element> {
      readonly ref?: (node: B) => void;
    }

    interface AriaAttributes {
      readonly role?: AttributeValue<string>;
    }

    interface SVGCommonAttributes<E extends globalThis.Element>
      extends CustomAttributes<E> {
      readonly id?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly lang?: AttributeValue<string>;
      readonly tabindex?: AttributeValue<number | bigint>;
      // Styling attributes
      readonly class?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly style?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
    }

    interface HTMLCommonAttributes<E extends globalThis.Element>
      extends CustomAttributes<E>,
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
        HTMLCommonAttributes<HTMLAnchorElement> {
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

    interface SVGAnchorAttributes
      extends WithChildren,
        SVGCommonAttributes<SVGElement> {
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

    interface HTMLAreaAttributes extends HTMLCommonAttributes<HTMLAreaElement> {
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

    interface HTMLInputAttributes
      extends HTMLCommonAttributes<HTMLInputElement> {
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

    interface HTMLImageAttributes
      extends HTMLCommonAttributes<HTMLImageElement> {
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
        HTMLCommonAttributes<HTMLLabelElement> {
      readonly for: AttributeValue<Exclude<AttributeLiteral, boolean>>;
    }

    interface HTMLDivAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLDivElement> {}

    interface HTMLHeaderAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement> {}

    interface HTMLButtonAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLButtonElement> {
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
        HTMLCommonAttributes<HTMLElement> {}

    interface HTMLFooterAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement> {}

    interface HTMLParagraphAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLParagraphElement> {}

    interface HTMLHtmlAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLHtmlElement> {
      readonly lang?: AttributeValue<string>;
      readonly xmlns?: AttributeValue<string>;
    }

    interface HTMLHeadAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLHeadElement> {}

    interface HTMLTitleAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLTitleElement> {}

    interface HTMLMetaAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLMetaElement> {
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
        HTMLCommonAttributes<HTMLBodyElement> {}

    interface SVGSVGAttributes extends WithChildren, SVGCommonAttributes<SVGSVGElement> {
      readonly height?: AttributeValue<'auto' | number | `${number}%`>      
      readonly preserveAspectRatio?: AttributeValue<'none' | `${'xMinYMin'| 'xMidYMin'| 'xMaxYMin'| 'xMinYMid'| 'xMidYMid'| 'xMaxYMid'| 'xMinYMax'| 'xMidYMax'| 'xMaxYMax'} ${'meet' | 'slice'}`>;
      readonly viewBox?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly width?: AttributeValue<'auto' | number | `${number}%`>;
      readonly x?: AttributeValue<number | `${number}%`>;
      readonly y?: AttributeValue<number | `${number}%`>;
      readonly xmlns?: AttributeValue<string>;
    }
  }
}

type EventAttributes<T extends globalThis.Element> = {
  readonly [K in keyof T as K extends `on${infer Name}`
    ? `on${Name}` | `on${Capitalize<Name>}${"" | EventListenerModifiers}`
    : never]?: (event: EventOf<T, Replace<K, "on", "">>) => void;
};
