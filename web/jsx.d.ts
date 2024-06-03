import { JSX, Getter, WithChildren, WithRef } from "moru";

type Cast<A, B> = A extends B ? A : B;

type Replace<
  O,
  P extends string,
  F extends string,
> = O extends `${infer A}${P}${infer B}` ? Replace<`${A}${F}${B}`, P, F> : O;

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

type EventOf<E extends globalThis.Element, Name> = E extends HTMLElement
  ? JSX.Event<E, HTMLElementEventMap[Cast<Name, keyof HTMLElementEventMap>]>
  : E extends SVGElement
    ? JSX.Event<E, SVGElementEventMap[Cast<Name, keyof SVGElementEventMap>]>
    : JSX.Event<E>;

type ElementOf<T extends keyof JSX.IntrinsicElements> =
  T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : T extends keyof SVGElementEventMap
      ? SVGElementEventMap[T]
      : HTMLUnknownElement;

type NumericAttributeLiteral = number | bigint;

type AttributeLiteral = string | boolean | NumericAttributeLiteral;

type WithStringIfNonBooleanAttribute<T> = boolean extends T
  ? T
  : T extends Exclude<T, string>
    ? T | string
    : T;

type AttributeValue<T extends AttributeLiteral> =
  | WithStringIfNonBooleanAttribute<T>
  | Getter<WithStringIfNonBooleanAttribute<T>>;

type EventAttributes<T extends globalThis.Element> = {
  readonly [K in keyof T as K extends `on${infer Name}`
    ? `on:${Name}` | `on:${Capitalize<Name>}${"" | EventListenerModifiers}`
    : never]?: (event: EventOf<T, Replace<K, "on", "">>) => void;
};

type CreateCSSDistance<Unit extends string> = `${number}${Unit}`;

declare module "moru" {
  export namespace JSX {
    interface ElementVariants {
      3: null;
      4: string;
      5: number;
      6: bigint;
      7: boolean;
      8: undefined;
      9: Node;
    }

    interface IntrinsicElements {
      // HTML + SVG
      readonly a: HTMLAnchorAttributes | SVGAnchorAttributes;

      // HTML
      readonly abbr: {} & EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly address: {} & EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly area: HTMLAreaAttributes;
      readonly article: HTMLArticleAttributes;
      readonly aside: {} & EventAttributes<HTMLElement> &
        IntrinsicProperties<HTMLElement>;
      readonly audio: HTMLAudioAttributes;
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
      readonly body: HTMLBodyAttributes;
      readonly br: HTMLBrAttributes;
      readonly button: HTMLButtonAttributes;
      readonly canvas: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly caption: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly center: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly cite: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly code: HTMLCodeAttributes;
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
      readonly div: HTMLDivAttributes;
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
      readonly footer: HTMLFooterAttributes;
      readonly form: HTMLFormAttributes;
      readonly frame: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly frameset: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly h1: HTMLHeadingAttributes;
      readonly h2: HTMLHeadingAttributes;
      readonly h3: HTMLHeadingAttributes;
      readonly h4: HTMLHeadingAttributes;
      readonly h5: HTMLHeadingAttributes;
      readonly h6: HTMLHeadingAttributes;
      readonly head: HTMLHeadAttributes;
      readonly header: HTMLHeaderAttributes;
      readonly hgroup: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly hr: HTMLHrAttributes;
      readonly html: HTMLHtmlAttributes;
      readonly i: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly iframe: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly img: HTMLImageAttributes;
      readonly input: HTMLInputAttributes;
      readonly ins: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly kbd: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly keygen: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly label: HTMLLabelAttributes;
      readonly legend: HTMLLegendAttributes;
      readonly li: HTMLLiAttributes;
      readonly link: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly main: HTMLMainAttributes;
      readonly map: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly mark: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly marquee: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly math: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly menu: HTMLMenuAttributes;
      readonly meta: HTMLMetaAttributes;
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
      readonly ol: HTMLOlAttributes;
      readonly optgroup: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly option: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly output: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly p: HTMLParagraphAttributes;
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
      readonly section: HTMLSectionAttributes;
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
      readonly span: HTMLSpanAttributes;
      readonly strike: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly strong: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly style: HTMLStyleAttributes;
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
      readonly textarea: HTMLTextAriaAttributes;
      readonly tfoot: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly th: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly thead: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly time: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly title: HTMLTitleAttributes;
      readonly tr: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly track: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly tt: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly u: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly ul: HTMLUlAttributes;
      readonly var: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly video: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly wbr: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;
      readonly xmp: {} & EventAttributes<HTMLAnchorElement> &
        IntrinsicProperties<HTMLElement>;

      // SVG
      readonly svg: SVGSVGAttributes;
      readonly animate: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly animateColor: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly animateMotion: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly animateTransform: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly circle: SVGCircleAttributes;
      readonly clipPath: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly "color-profile": {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly defs: SVGDefsAttributes;
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
      readonly foreignObject: SVGForeignObjectAttributes;
      readonly g: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly image: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly line: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly linearGradient: SVGLinearGradientAttributes;
      readonly marker: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly mask: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly metadata: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly mpath: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly path: SVGPathAttributes;
      readonly pattern: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly polygon: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly polyline: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly radialGradient: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly rect: SVGRectAttributes;
      readonly set: {} & EventAttributes<SVGElement> &
        IntrinsicProperties<SVGElement>;
      readonly stop: SVGStopAttributes;
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

    type Event<
      CurrentTarget extends EventTarget,
      NativeEvent extends globalThis.Event = globalThis.Event,
      Target extends EventTarget = globalThis.Element,
    > = NativeEvent & {
      readonly target: Target;
      readonly currentTarget: CurrentTarget;
    };

    type IntrinsicProperties<E extends globalThis.Element> = {
      readonly [K in keyof E as K extends string ? `prop:${K}` : never]?:
        | E[K]
        | Getter<E[K]>;
    };

    type CSSRelativeInheritedFontLengthUnit =
      | "cap"
      | "ch"
      | "em"
      | "ex"
      | "ic"
      | "lh";
    type CSSRelativeRootFontLengthUnit =
      `r${CSSRelativeInheritedFontLengthUnit}`;
    type CSSRelativeInheritedFontLength =
      CreateCSSDistance<CSSRelativeInheritedFontLengthUnit>;
    type CSSRelativeRootFontLength =
      CreateCSSDistance<CSSRelativeRootFontLengthUnit>;
    type CSSRelativeFontLength =
      | CSSRelativeRootFontLength
      | CSSRelativeInheritedFontLength;

    type CSSRelativeDefaultViewportLengthUnit =
      | "vh"
      | "vw"
      | "vmax"
      | "vmin"
      | "vb"
      | "vi";
    type CSSRelativeSmallViewportLengthUnit =
      `s${CSSRelativeDefaultViewportLengthUnit}`;
    type CSSRelativeLargeViewportLengthUnit =
      `l${CSSRelativeDefaultViewportLengthUnit}`;
    type CSSRelativeDynamicViewportLengthUnit =
      `d${CSSRelativeDefaultViewportLengthUnit}`;
    type CSSRelativeSmallViewportLength =
      CreateCSSDistance<CSSRelativeSmallViewportLengthUnit>;
    type CSSRelativeLargeViewportLength =
      CreateCSSDistance<CSSRelativeLargeViewportLengthUnit>;
    type CSSRelativeDynamicViewportLength =
      CreateCSSDistance<CSSRelativeDynamicViewportLengthUnit>;
    type CSSRelativeDefaultViewportLength =
      CreateCSSDistance<CSSRelativeDefaultViewportLengthUnit>;
    type CSSRelativeViewportLength =
      | CSSRelativeSmallViewportLength
      | CSSRelativeLargeViewportLength
      | CSSRelativeDynamicViewportLength
      | CSSRelativeDefaultViewportLength;

    type CSSRelativeContainerLengthUnit =
      | "cqw"
      | "cqh"
      | "cqi"
      | "cqb"
      | "cqmin"
      | "cqmax";
    type CSSRelativeContainerLength =
      CreateCSSDistance<CSSRelativeContainerLengthUnit>;

    type CSSAbsoluteLengthUnit = "px" | "cm" | "mm" | "Q" | "in" | "pc" | "pt";
    type CSSAbsoluteLength = CreateCSSDistance<CSSAbsoluteLengthUnit>;

    type CSSRelativeLength =
      | CSSRelativeFontLength
      | CSSRelativeViewportLength
      | CSSRelativeContainerLength;
    type CSSLength = CSSRelativeLength | CSSAbsoluteLength;

    type CSSPercentage = CreateCSSDistance<"%">;

    type CSSLengthPercentage = CSSLength | CSSPercentage;

    type SVGLength = number | CSSRelativeLength | CSSAbsoluteLength;

    type SVGLengthPercentage = SVGLength | CSSPercentage;

    interface CustomAttributes<B extends globalThis.Element>
      extends WithRef<B> {}

    // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
    interface AriaAttributes {
      /**
       * Identifies the currently active element when DOM focus is on a composite
       * widget, textbox, group, or application.
       */
      readonly "aria-activedescendant"?: AttributeValue<string>;
      /**
       * Indicates whether assistive technologies will present all, or only parts of,
       * the changed region based on the change notifications defined by the aria-relevant attribute.
       */
      readonly "aria-atomic"?: AttributeValue<boolean | "false" | "true">;
      /**
       * Indicates whether inputting text could trigger display of one or more predictions
       * of the user's intended value for an input and specifies how predictions would be
       * presented if they are made.
       */
      readonly "aria-autocomplete"?: AttributeValue<
        "none" | "inline" | "list" | "both"
      >;
      /**
       * Indicates an element is being modified and that assistive technologies MAY want
       * to wait until the modifications are complete before exposing them to the user.
       */
      readonly "aria-busy"?: AttributeValue<boolean | "false" | "true">;
      /**
       * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
       * @see aria-pressed @see aria-selected.
       */
      readonly "aria-checked"?: AttributeValue<
        boolean | "false" | "mixed" | "true"
      >;
      /**
       * Defines the total number of columns in a table, grid, or treegrid.
       * @see aria-colindex.
       */
      readonly "aria-colcount"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Defines an element's column index or position with respect to the total number
       * of columns within a table, grid, or treegrid.
       * @see aria-colcount
       * @see aria-colspan.
       */
      readonly "aria-colindex"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
       * @see aria-colindex @see aria-rowspan.
       */
      readonly "aria-colspan"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Identifies the element (or elements) whose contents or presence are controlled by the current element.
       * @see aria-owns.
       */
      readonly "aria-controls"?: AttributeValue<string>;
      /** Indicates the element that represents the current item within a container or set of related elements. */
      readonly "aria-current"?: AttributeValue<
        | boolean
        | "false"
        | "true"
        | "page"
        | "step"
        | "location"
        | "date"
        | "time"
      >;
      /**
       * Identifies the element (or elements) that describes the object.
       * @see aria-labelledby
       */
      readonly "aria-describedby"?: AttributeValue<string>;
      /**
       * Identifies the element that provides a detailed, extended description for the object.
       * @see aria-describedby.
       */
      readonly "aria-details"?: AttributeValue<string>;
      /**
       * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
       * @see aria-hidden @see aria-readonly.
       */
      readonly "aria-disabled"?: AttributeValue<boolean | "false" | "true">;
      /**
       * Identifies the element that provides an error message for the object.
       * @see aria-invalid @see aria-describedby.
       */
      readonly "aria-errormessage"?: AttributeValue<string>;
      /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
      readonly "aria-expanded"?: AttributeValue<boolean | "false" | "true">;
      /**
       * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
       * allows assistive technology to override the general default of reading in document source order.
       */
      readonly "aria-flowto"?: AttributeValue<string>;
      /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
      readonly "aria-haspopup"?: AttributeValue<
        | boolean
        | "false"
        | "true"
        | "menu"
        | "listbox"
        | "tree"
        | "grid"
        | "dialog"
      >;
      /**
       * Indicates whether the element is exposed to an accessibility API.
       * @see aria-disabled.
       */
      readonly "aria-hidden"?: AttributeValue<boolean | "false" | "true">;
      /**
       * Indicates the entered value does not conform to the format expected by the application.
       * @see aria-errormessage.
       */
      readonly "aria-invalid"?: AttributeValue<
        boolean | "false" | "true" | "grammar" | "spelling"
      >;
      /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
      readonly "aria-keyshortcuts"?: AttributeValue<string>;
      /**
       * Defines a string value that labels the current element.
       * @see aria-labelledby.
       */
      readonly "aria-label"?: AttributeValue<string>;
      /**
       * Identifies the element (or elements) that labels the current element.
       * @see aria-describedby.
       */
      readonly "aria-labelledby"?: AttributeValue<string>;
      /** Defines the hierarchical level of an element within a structure. */
      readonly "aria-level"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
      readonly "aria-live"?: AttributeValue<"off" | "assertive" | "polite">;
      /** Indicates whether an element is modal when displayed. */
      readonly "aria-modal"?: AttributeValue<boolean | "false" | "true">;
      /** Indicates whether a text box accepts multiple lines of input or only a single line. */
      readonly "aria-multiline"?: AttributeValue<boolean | "false" | "true">;
      /** Indicates that the user may select more than one item from the current selectable descendants. */
      readonly "aria-multiselectable"?: AttributeValue<
        boolean | "false" | "true"
      >;
      /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
      readonly "aria-orientation"?: AttributeValue<"horizontal" | "vertical">;
      /**
       * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
       * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
       * @see aria-controls.
       */
      readonly "aria-owns"?: AttributeValue<string>;
      /**
       * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
       * A hint could be a sample value or a brief description of the expected format.
       */
      readonly "aria-placeholder"?: AttributeValue<string>;
      /**
       * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
       * @see aria-setsize.
       */
      readonly "aria-posinset"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Indicates the current "pressed" state of toggle buttons.
       * @see aria-checked @see aria-selected.
       */
      readonly "aria-pressed"?: AttributeValue<
        boolean | "false" | "mixed" | "true"
      >;
      /**
       * Indicates that the element is not editable, but is otherwise operable.
       * @see aria-disabled.
       */
      readonly "aria-readonly"?: AttributeValue<boolean | "false" | "true">;
      /**
       * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
       * @see aria-atomic.
       */
      readonly "aria-relevant"?: AttributeValue<
        | "additions"
        | "additions removals"
        | "additions text"
        | "all"
        | "removals"
        | "removals additions"
        | "removals text"
        | "text"
        | "text additions"
        | "text removals"
      >;
      /** Indicates that user input is required on the element before a form may be submitted. */
      readonly "aria-required"?: AttributeValue<boolean | "false" | "true">;
      /** Defines a human-readable, author-localized description for the role of an element. */
      readonly "aria-roledescription"?: AttributeValue<string>;
      /**
       * Defines the total number of rows in a table, grid, or treegrid.
       * @see aria-rowindex.
       */
      readonly "aria-rowcount"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
       * @see aria-rowcount @see aria-rowspan.
       */
      readonly "aria-rowindex"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
       * @see aria-rowindex @see aria-colspan.
       */
      readonly "aria-rowspan"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Indicates the current "selected" state of various widgets.
       * @see aria-checked @see aria-pressed.
       */
      readonly "aria-selected"?: AttributeValue<boolean | "false" | "true">;
      /**
       * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
       * @see aria-posinset.
       */
      readonly "aria-setsize"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /** Indicates if items in a table or grid are sorted in ascending or descending order. */
      readonly "aria-sort"?: AttributeValue<
        "none" | "ascending" | "descending" | "other"
      >;
      /** Defines the maximum allowed value for a range widget. */
      readonly "aria-valuemax"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /** Defines the minimum allowed value for a range widget. */
      readonly "aria-valuemin"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /**
       * Defines the current value for a range widget.
       * @see aria-valuetext.
       */
      readonly "aria-valuenow"?: AttributeValue<
        Exclude<AttributeLiteral, boolean>
      >;
      /** Defines the human-readable text alternative of aria-valuenow for a range widget. */
      readonly "aria-valuetext"?: AttributeValue<string>;
      readonly role?: AttributeValue<
        | "alert"
        | "alertdialog"
        | "application"
        | "article"
        | "banner"
        | "button"
        | "cell"
        | "checkbox"
        | "columnheader"
        | "combobox"
        | "complementary"
        | "contentinfo"
        | "definition"
        | "dialog"
        | "directory"
        | "document"
        | "feed"
        | "figure"
        | "form"
        | "grid"
        | "gridcell"
        | "group"
        | "heading"
        | "img"
        | "link"
        | "list"
        | "listbox"
        | "listitem"
        | "log"
        | "main"
        | "marquee"
        | "math"
        | "menu"
        | "menubar"
        | "menuitem"
        | "menuitemcheckbox"
        | "menuitemradio"
        | "meter"
        | "navigation"
        | "none"
        | "note"
        | "option"
        | "presentation"
        | "progressbar"
        | "radio"
        | "radiogroup"
        | "region"
        | "row"
        | "rowgroup"
        | "rowheader"
        | "scrollbar"
        | "search"
        | "searchbox"
        | "separator"
        | "slider"
        | "spinbutton"
        | "status"
        | "switch"
        | "tab"
        | "table"
        | "tablist"
        | "tabpanel"
        | "term"
        | "textbox"
        | "timer"
        | "toolbar"
        | "tooltip"
        | "tree"
        | "treegrid"
        | "treeitem"
      >;
    }

    interface SVGCommonAttributes<E extends SVGElement>
      extends CustomAttributes<E> {
      readonly id?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly lang?: AttributeValue<string>;
      readonly tabindex?: AttributeValue<NumericAttributeLiteral>;
      // Styling attributes
      readonly class?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly style?: AttributeValue<string>;
      readonly fill?: AttributeValue<string>;
      readonly [key: `data-${string}`]: AttributeValue<AttributeLiteral>;
    }

    interface HTMLCommonAttributes<E extends HTMLElement>
      extends CustomAttributes<E>,
        AriaAttributes {
      readonly accesskey?: AttributeValue<string>;
      readonly autocapitalize?: AttributeValue<
        "off" | "none" | "on" | "sentences" | "words" | "characters"
      >;
      readonly autofocus?: AttributeValue<boolean>;
      readonly class?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly contenteditable?: AttributeValue<boolean | "true" | "false">;
      readonly [key: `data-${string}`]: AttributeValue<AttributeLiteral>;
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
      readonly style?: AttributeValue<string>;
      readonly tabindex?: AttributeValue<NumericAttributeLiteral>;
      readonly title?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly translate?: AttributeValue<boolean | "yes" | "no">;
    }

    type Target = "_self" | "_blank" | "_parent" | "_top";

    interface HTMLAnchorAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLAnchorElement>,
        EventAttributes<HTMLAnchorElement>,
        IntrinsicProperties<HTMLAnchorElement> {
      readonly href: AttributeValue<string>;
      readonly target?: AttributeValue<Target>;
      readonly download?: AttributeValue<
        Exclude<AttributeLiteral, NumericAttributeLiteral>
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
        SVGCommonAttributes<SVGElement>,
        EventAttributes<SVGElement>,
        IntrinsicProperties<SVGElement> {
      readonly href: AttributeValue<string>;
      readonly target?: AttributeValue<Target>;
      readonly download?: AttributeValue<
        Exclude<AttributeLiteral, NumericAttributeLiteral>
      >;
      readonly hreflang?: AttributeValue<string>;
      readonly ping?: AttributeValue<string>;
      readonly referrerpolicy?: AttributeValue<ReferrerPolicy>;
      // TODO: Describe and set explicit values of the link types.
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
      readonly rel?: AttributeValue<string>;
      readonly type?: AttributeValue<string>;
    }

    interface HTMLAreaAttributes
      extends HTMLCommonAttributes<HTMLAreaElement>,
        EventAttributes<HTMLAreaElement>,
        IntrinsicProperties<HTMLAreaElement> {
      readonly alt?: AttributeValue<string>;
      readonly coords?: AttributeValue<
        | `${number},${number},${number}`
        | `${number},${number},${number},${number}`
        | string
      >;
      readonly download?: AttributeValue<
        Exclude<AttributeLiteral, NumericAttributeLiteral>
      >;
      readonly href?: AttributeValue<string>;
      readonly ping?: AttributeValue<string>;
      readonly referrerpolicy?: AttributeValue<ReferrerPolicy>;
      readonly rel?: AttributeValue<string>;
      readonly shape?: AttributeValue<"rect" | "circle" | "poly" | "default">;
      readonly target?: AttributeValue<Target>;
    }

    type Crossorigin = "anonymous" | "use-credentials";

    interface HTMLAudioAttributes
      extends HTMLCommonAttributes<HTMLAudioElement>,
        EventAttributes<HTMLAudioElement>,
        IntrinsicProperties<HTMLAudioElement> {
      readonly autoplay?: AttributeValue<boolean>;
      readonly controls?: AttributeValue<boolean>;
      readonly controlslist?: AttributeValue<
        "nodownload" | "nofullscreen" | "noremoteplayback"
      >;
      readonly crossorigin?: AttributeValue<Crossorigin>;
      readonly disableremoteplayback?: AttributeValue<boolean>;
      readonly loop?: AttributeValue<boolean>;
      readonly muted?: AttributeValue<boolean>;
      readonly preload?: AttributeValue<"none" | "metadata" | "auto">;
      readonly src?: AttributeValue<string>;
    }

    type FormEncType =
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "text/plain";

    type FormMethod = "get" | "post" | "dialog";

    interface HTMLInputAttributes
      extends HTMLCommonAttributes<HTMLInputElement>,
        EventAttributes<HTMLInputElement>,
        IntrinsicProperties<HTMLInputElement> {
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
      readonly formmethod?: AttributeValue<FormMethod>;
      readonly formnovalidate?: AttributeValue<boolean>;
      readonly formtarget?: AttributeValue<Target>;
      readonly height?: AttributeValue<NumericAttributeLiteral>;
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
      readonly max?: AttributeValue<NumericAttributeLiteral>;
      readonly min?: AttributeValue<NumericAttributeLiteral>;
      readonly maxlength?: AttributeValue<NumericAttributeLiteral>;
      readonly minlength?: AttributeValue<NumericAttributeLiteral>;
      readonly multiple?: AttributeValue<boolean>;
      readonly name?: AttributeValue<string>;
      readonly pattern?: AttributeValue<string>;
      readonly placeholder?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly readonly?: AttributeValue<boolean>;
      readonly required?: AttributeValue<boolean>;
      readonly size?: AttributeValue<NumericAttributeLiteral>;
      readonly src?: AttributeValue<string>;
      readonly step?: AttributeValue<"any" | NumericAttributeLiteral>;
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
      readonly width?: AttributeValue<NumericAttributeLiteral>;
    }

    interface HTMLImageAttributes
      extends HTMLCommonAttributes<HTMLImageElement>,
        EventAttributes<HTMLImageElement>,
        IntrinsicProperties<HTMLImageElement> {
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
        HTMLCommonAttributes<HTMLLabelElement>,
        EventAttributes<HTMLLabelElement>,
        IntrinsicProperties<HTMLLabelElement> {
      readonly for?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
    }

    interface HTMLDivAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLDivElement>,
        EventAttributes<HTMLDivElement>,
        IntrinsicProperties<HTMLDivElement> {}

    interface HTMLHeaderAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement>,
        EventAttributes<HTMLElement>,
        IntrinsicProperties<HTMLElement> {}

    interface HTMLButtonAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLButtonElement>,
        EventAttributes<HTMLButtonElement>,
        IntrinsicProperties<HTMLButtonElement> {
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
        HTMLCommonAttributes<HTMLElement>,
        EventAttributes<HTMLElement>,
        IntrinsicProperties<HTMLElement> {}

    interface HTMLFooterAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement>,
        EventAttributes<HTMLElement>,
        IntrinsicProperties<HTMLElement> {}

    interface HTMLParagraphAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLParagraphElement>,
        EventAttributes<HTMLParagraphElement>,
        IntrinsicProperties<HTMLParagraphElement> {}

    interface HTMLCodeAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement>,
        EventAttributes<HTMLElement>,
        IntrinsicProperties<HTMLElement> {}

    interface HTMLHeadingAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement>,
        EventAttributes<HTMLElement>,
        IntrinsicProperties<HTMLElement> {}

    interface HTMLLegendAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLLegendElement>,
        EventAttributes<HTMLLegendElement>,
        IntrinsicProperties<HTMLLegendElement> {}

    interface HTMLFormAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLFormElement>,
        EventAttributes<HTMLFormElement>,
        IntrinsicProperties<HTMLFormElement> {
      readonly "accept-charset"?: AttributeValue<string>;
      readonly autocomplete?: AttributeValue<boolean>;
      readonly name?: AttributeValue<string>;
      // TODO: describe more precisely rel types.
      readonly rel?: AttributeValue<string>;
      readonly action?: AttributeValue<string>;
      readonly enctype?: AttributeValue<FormEncType>;
      readonly method?: AttributeValue<FormMethod>;
      readonly novalidate?: AttributeValue<boolean>;
      readonly target?: AttributeValue<Target | "_unfencedTop">;
    }

    interface HTMLHtmlAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLHtmlElement>,
        EventAttributes<HTMLHtmlElement>,
        IntrinsicProperties<HTMLHtmlElement> {
      readonly lang?: AttributeValue<string>;
      readonly xmlns?: AttributeValue<string>;
    }

    interface HTMLHrAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLHRElement>,
        EventAttributes<HTMLHRElement>,
        IntrinsicProperties<HTMLHRElement> {}

    interface HTMLHeadAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLHeadElement>,
        EventAttributes<HTMLHeadElement>,
        IntrinsicProperties<HTMLHeadElement> {}

    interface HTMLTitleAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLTitleElement>,
        EventAttributes<HTMLTitleElement>,
        IntrinsicProperties<HTMLTitleElement> {}

    interface HTMLMetaAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLMetaElement>,
        EventAttributes<HTMLMetaElement>,
        IntrinsicProperties<HTMLMetaElement> {
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
        HTMLCommonAttributes<HTMLBodyElement>,
        EventAttributes<HTMLBodyElement>,
        IntrinsicProperties<HTMLBodyElement> {}

    interface HTMLSpanAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLSpanElement>,
        EventAttributes<HTMLSpanElement>,
        IntrinsicProperties<HTMLSpanElement> {}

    interface HTMLSectionAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement>,
        EventAttributes<HTMLElement>,
        IntrinsicProperties<HTMLElement> {}

    interface HTMLArticleAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLElement>,
        EventAttributes<HTMLElement>,
        IntrinsicProperties<HTMLElement> {}

    interface HTMLBrAttributes
      extends HTMLCommonAttributes<HTMLBRElement>,
        EventAttributes<HTMLBRElement>,
        IntrinsicProperties<HTMLBRElement> {}

    interface HTMLMenuAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLMenuElement>,
        EventAttributes<HTMLMenuElement>,
        IntrinsicProperties<HTMLMenuElement> {}

    interface HTMLUlAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLUListElement>,
        EventAttributes<HTMLUListElement>,
        IntrinsicProperties<HTMLUListElement> {}

    interface HTMLOlAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLOListElement>,
        EventAttributes<HTMLOListElement>,
        IntrinsicProperties<HTMLOListElement> {
      readonly reversed?: AttributeValue<boolean>;
      readonly start?: AttributeValue<NumericAttributeLiteral>;
      readonly type?: AttributeValue<"a" | "A" | "i" | "I" | 1 | "1">;
    }

    interface HTMLLiAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLLIElement>,
        EventAttributes<HTMLLIElement>,
        IntrinsicProperties<HTMLLIElement> {
      readonly value?: AttributeValue<NumericAttributeLiteral>;
    }

    type TextDirection = "ltr" | "rtl";

    interface HTMLTextAriaAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLTextAreaElement>,
        EventAttributes<HTMLTextAreaElement>,
        IntrinsicProperties<HTMLTextAreaElement> {
      readonly autocomplete?: AttributeValue<"on" | "off">;
      readonly autofocus?: AttributeValue<boolean>;
      readonly cols?: AttributeValue<NumericAttributeLiteral>;
      readonly rows?: AttributeValue<NumericAttributeLiteral>;
      readonly dirname?: AttributeValue<TextDirection>;
      readonly disabled?: AttributeValue<boolean>;
      readonly form?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly maxlength?: AttributeValue<NumericAttributeLiteral>;
      readonly minlength?: AttributeValue<NumericAttributeLiteral>;
      readonly name?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly placeholder?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly readonly?: AttributeValue<boolean>;
      readonly required?: AttributeValue<boolean>;
      readonly wrap?: AttributeValue<"hard" | "soft">;
    }

    interface HTMLStyleAttributes
      extends WithChildren,
        HTMLCommonAttributes<HTMLStyleElement>,
        EventAttributes<HTMLStyleElement>,
        IntrinsicProperties<HTMLStyleElement> {
      readonly media?: AttributeValue<string>;
      readonly nonce?: AttributeValue<string>;
    }

    interface SVGSVGAttributes
      extends WithChildren,
        SVGCommonAttributes<SVGSVGElement>,
        EventAttributes<SVGSVGElement>,
        IntrinsicProperties<SVGSVGElement> {
      readonly height?: AttributeValue<"auto" | SVGLengthPercentage>;
      readonly preserveAspectRatio?: AttributeValue<
        | "none"
        | `${
            | "xMinYMin"
            | "xMidYMin"
            | "xMaxYMin"
            | "xMinYMid"
            | "xMidYMid"
            | "xMaxYMid"
            | "xMinYMax"
            | "xMidYMax"
            | "xMaxYMax"} ${"meet" | "slice"}`
      >;
      readonly viewBox?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly width?: AttributeValue<"auto" | SVGLengthPercentage>;
      readonly x?: AttributeValue<SVGLengthPercentage>;
      readonly y?: AttributeValue<SVGLengthPercentage>;
      readonly xmlns?: AttributeValue<string>;
    }

    interface SVGPathAttributes
      extends SVGCommonAttributes<SVGPathElement>,
        EventAttributes<SVGPathElement>,
        IntrinsicProperties<SVGPathElement> {
      readonly d?: AttributeValue<string>;
      readonly pathLength?: AttributeValue<NumericAttributeLiteral>;
    }

    interface SVGForeignObjectAttributes
      extends WithChildren,
        SVGCommonAttributes<SVGForeignObjectElement>,
        IntrinsicProperties<SVGForeignObjectElement>,
        EventAttributes<SVGForeignObjectElement> {
      readonly x?: AttributeValue<SVGLengthPercentage>;
      readonly y?: AttributeValue<SVGLengthPercentage>;
      readonly width?: AttributeValue<"auto" | SVGLengthPercentage>;
      readonly height?: AttributeValue<"auto" | SVGLengthPercentage>;
    }

    interface SVGRectAttributes
      extends SVGCommonAttributes<SVGRectElement>,
        IntrinsicProperties<SVGRectElement>,
        EventAttributes<SVGRectElement> {
      readonly x?: AttributeValue<SVGLengthPercentage>;
      readonly y?: AttributeValue<SVGLengthPercentage>;
      readonly rx?: AttributeValue<"auto" | SVGLengthPercentage>;
      readonly ry?: AttributeValue<"auto" | SVGLengthPercentage>;
      readonly width?: AttributeValue<"auto" | SVGLengthPercentage>;
      readonly height?: AttributeValue<"auto" | SVGLengthPercentage>;
      readonly pathLength?: AttributeValue<"none" | number>;
    }

    interface SVGDefsAttributes
      extends WithChildren,
        SVGCommonAttributes<SVGDefsElement>,
        IntrinsicProperties<SVGDefsElement>,
        EventAttributes<SVGDefsElement> {}

    interface SVGLinearGradientAttributes
      extends WithChildren,
        SVGCommonAttributes<SVGLinearGradientElement>,
        IntrinsicProperties<SVGLinearGradientElement>,
        EventAttributes<SVGLinearGradientElement> {
      readonly gradientUnits?: AttributeValue<
        "userSpaceOnUse" | "objectBoundingBox"
      >;
      readonly gradientTransform?: AttributeValue<string>;
      readonly href?: AttributeValue<string>;
      readonly spreadMethod?: AttributeValue<"pad" | "reflect" | "repeat">;
      readonly x1?: AttributeValue<SVGLengthPercentage>;
      readonly x2?: AttributeValue<SVGLengthPercentage>;
      readonly y1?: AttributeValue<SVGLengthPercentage>;
      readonly y2?: AttributeValue<SVGLengthPercentage>;
    }

    interface SVGStopAttributes
      extends SVGCommonAttributes<SVGStopElement>,
        IntrinsicProperties<SVGStopElement>,
        EventAttributes<SVGStopElement> {
      readonly offset?: AttributeValue<SVGLengthPercentage>;
      readonly "stop-color"?: AttributeValue<string>;
      readonly "stop-opacity"?: AttributeValue<NumericAttributeLiteral>;
    }

    interface SVGCircleAttributes
      extends SVGCommonAttributes<SVGCircleElement>,
        IntrinsicProperties<SVGCircleElement>,
        EventAttributes<SVGCircleElement> {
      readonly cx?: AttributeValue<SVGLengthPercentage>;
      readonly cy?: AttributeValue<SVGLengthPercentage>;
      readonly r?: AttributeValue<SVGLengthPercentage>;
      readonly pathLength?: AttributeValue<"none" | number>;
    }
  }
}
