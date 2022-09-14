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
    interface Element extends globalThis.Element {}

    type Node =
      | null
      | undefined
      | string
      | number
      | bigint
      | boolean
      | globalThis.Node
      | readonly Node[]
      | (() => Node);

    type Event<
      T extends Element,
      E extends globalThis.Event = globalThis.Event
    > = E & {
      currentTarget: T;
    };

    type EventOf<E extends Element, Name> = E extends HTMLElement
      ? HTMLElementEventMap[Cast<Name, keyof HTMLElementEventMap>]
      : E extends SVGElement
      ? SVGElementEventMap[Cast<Name, keyof SVGElementEventMap>]
      : globalThis.Event;

    type EventsOf<T extends Element> = {
      [K in keyof T as K extends `on${infer Name}`
        ? `on${Name}` | `on${Capitalize<Name>}${"" | EventListenerModifiers}`
        : never]?: (event: Event<T, EventOf<T, Replace<K, "on", "">>>) => void;
    };

    type ElementOf<T extends keyof ElementAttributesMap> =
      T extends keyof HTMLElementTagNameMap
        ? HTMLElementTagNameMap[T]
        : T extends keyof SVGElementEventMap
        ? SVGElementEventMap[T]
        : HTMLUnknownElement;

    type AttributesOf<T extends keyof ElementAttributesMap> =
      ElementAttributesMap[T] &
        EventsOf<ElementOf<T>> &
        RefAttribute<ElementOf<T>>;

    type AttributesWithChildrenOf<T extends keyof ElementAttributesMap> =
      Partial<WithChildren<AttributesOf<T>>>;

    type AttributeLiteral = string | number | bigint | boolean;

    type AttributeValue<T extends AttributeLiteral = string> =
      | Mix<T, string, boolean>
      | (() => Mix<T, string, boolean>);

    interface AriaAttributes {
      role?: AttributeValue<string>;
    }

    interface CommonAttributes extends AriaAttributes {
      accesskey?: AttributeValue<string>;
      autocapitalize?: AttributeValue<
        "off" | "none" | "on" | "sentences" | "words" | "characters"
      >;
      autofocus?: AttributeValue<boolean>;
      class?:
        | AttributeValue<Exclude<AttributeLiteral, boolean>>
        | readonly (
            | Exclude<AttributeLiteral, boolean>
            | Record<string, AttributeValue<boolean>>
          )[];
      contenteditable?: AttributeValue<boolean | "true" | "false">;
      [key: `data-${string}`]: AttributeValue;
      dir?: AttributeValue<"ltr" | "rtl" | "auto">;
      draggable?: AttributeValue<"true" | "false">;
      enterkeyhint?: AttributeValue<
        "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
      >;
      exportparts?: AttributeValue<string>;
      hidden?: AttributeValue<boolean>;
      id?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      inputmode?: AttributeValue<
        | "none"
        | "text"
        | "decimal"
        | "numeric"
        | "tel"
        | "search"
        | "email"
        | "url"
      >;
      is?: AttributeValue<string>;
      itemid?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      itemprop?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      itemref?: AttributeValue<string>;
      itemscope?: AttributeValue<boolean>;
      itemtype?: AttributeValue<string>;
      lang?: AttributeValue<string>;
      nonce?: AttributeValue<string>;
      part?: AttributeValue<string>;
      slot?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      spellcheck?: AttributeValue<boolean | "true" | "false">;
      style?:
        | AttributeValue<Exclude<AttributeLiteral, boolean>>
        | {
            [K in Exclude<keyof CSSStyleDeclaration, symbol>]?: AttributeValue<
              Exclude<AttributeLiteral, boolean>
            >;
          };
      tabindex?: AttributeValue<number | bigint>;
      title?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      translate?: AttributeValue<boolean | "yes" | "no">;
    }

    interface RefAttribute<E extends Element> {
      ref?: (value: E) => void;
    }

    type LinkTarget = "_self" | "_blank" | "_parent" | "_top";

    interface HTMLAnchorAttributes extends CommonAttributes {
      href?: AttributeValue<string>;
      target?: AttributeValue<LinkTarget>;
      download?: AttributeValue<Exclude<AttributeLiteral, number | bigint>>;
      hreflang?: AttributeValue<string>;
      ping?: AttributeValue<string>;
      referrerpolicy?: AttributeValue<ReferrerPolicy>;
      // TODO: Describe and set explicit values of the link types.
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
      rel?: AttributeValue<string>;
      type?: AttributeValue<string>;
    }

    interface HTMLAreaAttributes extends CommonAttributes {
      alt?: AttributeValue<string>;
      coords?: AttributeValue<
        | `${number},${number},${number}`
        | `${number},${number},${number},${number}`
        | string
      >;
      download?: AttributeValue<Exclude<AttributeLiteral, number | bigint>>;
      href?: AttributeValue<string>;
      ping?: AttributeValue<string>;
      referrerpolicy?: AttributeValue<ReferrerPolicy>;
      rel?: AttributeValue<string>;
      shape?: AttributeValue<"rect" | "circle" | "poly" | "default">;
      target?: AttributeValue<LinkTarget>;
    }

    interface HTMLAudioAttributes extends CommonAttributes {
      autoplay?: AttributeValue<boolean>;
      controls?: AttributeValue<boolean>;
      controlslist?: AttributeValue<
        "nodownload" | "nofullscreen" | "noremoteplayback"
      >;
      crossorigin?: AttributeValue<"anonymous" | "use-credentials">;
      disableremoteplayback?: AttributeValue<boolean>;
      loop?: AttributeValue<boolean>;
      muted?: AttributeValue<boolean>;
      preload?: AttributeValue<"none" | "metadata" | "auto">;
      src?: AttributeValue<string>;
    }

    interface HTMLInputAttributes extends CommonAttributes {
      accept?: AttributeValue<string>;
      alt?: AttributeValue<string>;
      // TODO: provide a full list.
      autocomplete?: AttributeValue<string>;
      autofocus?: AttributeValue<boolean>;
      capture?: AttributeValue<"user" | "environment">;
      checked?: AttributeValue<boolean>;
      dirname?: AttributeValue<string>;
      disabled?: AttributeValue<boolean>;
      form?: AttributeValue<string>;
      formaction?: AttributeValue<string>;
      formenctype?: AttributeValue<
        | "application/x-www-form-urlencoded"
        | "multipart/form-data"
        | "text/plain"
      >;
      formmethod?: AttributeValue<"get" | "post" | "dialog">;
      formnovalidate?: AttributeValue<boolean>;
      formtarget?: AttributeValue<LinkTarget>;
      height?: AttributeValue<number | bigint>;
      inputmode?: AttributeValue<
        | "none"
        | "text"
        | "tel"
        | "url"
        | "email"
        | "numeric"
        | "decimal"
        | "search"
      >;
      list?: AttributeValue<string>;
      max?: AttributeValue<number | bigint>;
      min?: AttributeValue<number | bigint>;
      maxlength?: AttributeValue<number | bigint>;
      minlength?: AttributeValue<number | bigint>;
      multiple?: AttributeValue<boolean>;
      name?: AttributeValue<string>;
      pattern?: AttributeValue<string>;
      placeholder?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      readonly?: AttributeValue<boolean>;
      required?: AttributeValue<boolean>;
      size?: AttributeValue<number | bigint>;
      src?: AttributeValue<string>;
      step?: AttributeValue<"any" | number | bigint>;
      type?: AttributeValue<
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
      value?: AttributeValue<Exclude<AttributeLiteral, boolean>>;
      width?: AttributeValue<number | bigint>;
    }

    interface ElementAttributesMap {
      // HTML
      a: HTMLAnchorAttributes;
      abbr: CommonAttributes;
      address: CommonAttributes;
      area: HTMLAreaAttributes;
      article: CommonAttributes;
      aside: CommonAttributes;
      audio: HTMLAudioAttributes;
      b: CommonAttributes;
      base: CommonAttributes;
      basefont: CommonAttributes;
      bdi: CommonAttributes;
      bdo: CommonAttributes;
      bgsound: CommonAttributes;
      big: CommonAttributes;
      blink: CommonAttributes;
      blockquote: CommonAttributes;
      body: CommonAttributes;
      br: CommonAttributes;
      button: CommonAttributes;
      canvas: CommonAttributes;
      caption: CommonAttributes;
      center: CommonAttributes;
      cite: CommonAttributes;
      code: CommonAttributes;
      col: CommonAttributes;
      colgroup: CommonAttributes;
      content: CommonAttributes;
      data: CommonAttributes;
      datalist: CommonAttributes;
      dd: CommonAttributes;
      del: CommonAttributes;
      details: CommonAttributes;
      dfn: CommonAttributes;
      dialog: CommonAttributes;
      dir: CommonAttributes;
      div: CommonAttributes;
      dl: CommonAttributes;
      dt: CommonAttributes;
      em: CommonAttributes;
      embed: CommonAttributes;
      fieldset: CommonAttributes;
      figcaption: CommonAttributes;
      figure: CommonAttributes;
      font: CommonAttributes;
      footer: CommonAttributes;
      form: CommonAttributes;
      frame: CommonAttributes;
      frameset: CommonAttributes;
      head: CommonAttributes;
      header: CommonAttributes;
      hgroup: CommonAttributes;
      hr: CommonAttributes;
      html: CommonAttributes;
      i: CommonAttributes;
      iframe: CommonAttributes;
      img: CommonAttributes;
      input: HTMLInputAttributes;
      ins: CommonAttributes;
      kbd: CommonAttributes;
      keygen: CommonAttributes;
      label: CommonAttributes;
      legend: CommonAttributes;
      li: CommonAttributes;
      link: CommonAttributes;
      main: CommonAttributes;
      map: CommonAttributes;
      mark: CommonAttributes;
      marquee: CommonAttributes;
      math: CommonAttributes;
      menu: CommonAttributes;
      menuitem: CommonAttributes;
      meta: CommonAttributes;
      meter: CommonAttributes;
      nav: CommonAttributes;
      nobr: CommonAttributes;
      noembed: CommonAttributes;
      noframes: CommonAttributes;
      noscript: CommonAttributes;
      object: CommonAttributes;
      ol: CommonAttributes;
      optgroup: CommonAttributes;
      option: CommonAttributes;
      output: CommonAttributes;
      p: CommonAttributes;
      param: CommonAttributes;
      picture: CommonAttributes;
      plaintext: CommonAttributes;
      portal: CommonAttributes;
      pre: CommonAttributes;
      progress: CommonAttributes;
      q: CommonAttributes;
      rb: CommonAttributes;
      rp: CommonAttributes;
      rt: CommonAttributes;
      rtc: CommonAttributes;
      ruby: CommonAttributes;
      s: CommonAttributes;
      samp: CommonAttributes;
      script: CommonAttributes;
      section: CommonAttributes;
      select: CommonAttributes;
      shadow: CommonAttributes;
      slot: CommonAttributes;
      small: CommonAttributes;
      source: CommonAttributes;
      spacer: CommonAttributes;
      span: CommonAttributes;
      strike: CommonAttributes;
      strong: CommonAttributes;
      style: CommonAttributes;
      sub: CommonAttributes;
      summary: CommonAttributes;
      sup: CommonAttributes;
      table: CommonAttributes;
      tbody: CommonAttributes;
      td: CommonAttributes;
      template: CommonAttributes;
      textarea: CommonAttributes;
      tfoot: CommonAttributes;
      th: CommonAttributes;
      thead: CommonAttributes;
      time: CommonAttributes;
      title: CommonAttributes;
      tr: CommonAttributes;
      track: CommonAttributes;
      tt: CommonAttributes;
      u: CommonAttributes;
      ul: CommonAttributes;
      var: CommonAttributes;
      video: CommonAttributes;
      wbr: CommonAttributes;
      xmp: CommonAttributes;

      // SVG
      svg: CommonAttributes;
      animate: CommonAttributes;
      animateColor: CommonAttributes;
      animateMotion: CommonAttributes;
      animateTransform: CommonAttributes;
      circle: CommonAttributes;
      clipPath: CommonAttributes;
      "color-profile": CommonAttributes;
      defs: CommonAttributes;
      desc: CommonAttributes;
      ellipse: CommonAttributes;
      feBlend: CommonAttributes;
      feColorMatrix: CommonAttributes;
      feComponentTransfer: CommonAttributes;
      feComposite: CommonAttributes;
      feConvolveMatrix: CommonAttributes;
      feDiffuseLighting: CommonAttributes;
      feDisplacementMap: CommonAttributes;
      feDistantLight: CommonAttributes;
      feFlood: CommonAttributes;
      feFuncA: CommonAttributes;
      feFuncB: CommonAttributes;
      feFuncG: CommonAttributes;
      feFuncR: CommonAttributes;
      feGaussianBlur: CommonAttributes;
      feImage: CommonAttributes;
      feMerge: CommonAttributes;
      feMergeNode: CommonAttributes;
      feMorphology: CommonAttributes;
      feOffset: CommonAttributes;
      fePointLight: CommonAttributes;
      feSpecularLighting: CommonAttributes;
      feSpotLight: CommonAttributes;
      feTile: CommonAttributes;
      feTurbulence: CommonAttributes;
      filter: CommonAttributes;
      foreignObject: CommonAttributes;
      g: CommonAttributes;
      image: CommonAttributes;
      line: CommonAttributes;
      linearGradient: CommonAttributes;
      marker: CommonAttributes;
      mask: CommonAttributes;
      metadata: CommonAttributes;
      mpath: CommonAttributes;
      path: CommonAttributes;
      pattern: CommonAttributes;
      polygon: CommonAttributes;
      polyline: CommonAttributes;
      radialGradient: CommonAttributes;
      rect: CommonAttributes;
      set: CommonAttributes;
      stop: CommonAttributes;
      switch: CommonAttributes;
      symbol: CommonAttributes;
      text: CommonAttributes;
      textPath: CommonAttributes;
      tspan: CommonAttributes;
      use: CommonAttributes;
      view: CommonAttributes;
    }

    interface IntrinsicAttributes {}

    interface ElementChildrenAttribute extends Partial<WithChildren<{}>> {}

    interface IntrinsicElements {
      // HTML
      a: AttributesWithChildrenOf<"a">;
      abbr: AttributesWithChildrenOf<"abbr">;
      address: AttributesWithChildrenOf<"address">;
      area: AttributesWithChildrenOf<"area">;
      article: AttributesWithChildrenOf<"article">;
      aside: AttributesWithChildrenOf<"aside">;
      audio: AttributesWithChildrenOf<"audio">;
      b: AttributesWithChildrenOf<"b">;
      base: AttributesWithChildrenOf<"base">;
      basefont: AttributesWithChildrenOf<"basefont">;
      bdi: AttributesWithChildrenOf<"bdi">;
      bdo: AttributesWithChildrenOf<"bdo">;
      bgsound: AttributesWithChildrenOf<"bgsound">;
      big: AttributesWithChildrenOf<"big">;
      blink: AttributesWithChildrenOf<"blink">;
      blockquote: AttributesWithChildrenOf<"blockquote">;
      body: AttributesWithChildrenOf<"body">;
      br: AttributesWithChildrenOf<"br">;
      button: AttributesWithChildrenOf<"button">;
      canvas: AttributesWithChildrenOf<"canvas">;
      caption: AttributesWithChildrenOf<"caption">;
      center: AttributesWithChildrenOf<"center">;
      cite: AttributesWithChildrenOf<"cite">;
      code: AttributesWithChildrenOf<"code">;
      col: AttributesWithChildrenOf<"col">;
      colgroup: AttributesWithChildrenOf<"colgroup">;
      content: AttributesWithChildrenOf<"content">;
      data: AttributesWithChildrenOf<"data">;
      datalist: AttributesWithChildrenOf<"datalist">;
      dd: AttributesWithChildrenOf<"dd">;
      del: AttributesWithChildrenOf<"del">;
      details: AttributesWithChildrenOf<"details">;
      dfn: AttributesWithChildrenOf<"dfn">;
      dialog: AttributesWithChildrenOf<"dialog">;
      dir: AttributesWithChildrenOf<"dir">;
      div: AttributesWithChildrenOf<"div">;
      dl: AttributesWithChildrenOf<"dl">;
      dt: AttributesWithChildrenOf<"dt">;
      em: AttributesWithChildrenOf<"em">;
      embed: AttributesWithChildrenOf<"embed">;
      fieldset: AttributesWithChildrenOf<"fieldset">;
      figcaption: AttributesWithChildrenOf<"figcaption">;
      figure: AttributesWithChildrenOf<"figure">;
      font: AttributesWithChildrenOf<"font">;
      footer: AttributesWithChildrenOf<"footer">;
      form: AttributesWithChildrenOf<"form">;
      frame: AttributesWithChildrenOf<"frame">;
      frameset: AttributesWithChildrenOf<"frameset">;
      head: AttributesWithChildrenOf<"head">;
      header: AttributesWithChildrenOf<"header">;
      hgroup: AttributesWithChildrenOf<"hgroup">;
      hr: AttributesWithChildrenOf<"hr">;
      html: AttributesWithChildrenOf<"html">;
      i: AttributesWithChildrenOf<"i">;
      iframe: AttributesWithChildrenOf<"iframe">;
      img: AttributesOf<"img">;
      input: AttributesWithChildrenOf<"input">;
      ins: AttributesWithChildrenOf<"ins">;
      kbd: AttributesWithChildrenOf<"kbd">;
      keygen: AttributesWithChildrenOf<"keygen">;
      label: AttributesWithChildrenOf<"label">;
      legend: AttributesWithChildrenOf<"legend">;
      li: AttributesWithChildrenOf<"li">;
      link: AttributesOf<"link">;
      main: AttributesWithChildrenOf<"main">;
      map: AttributesWithChildrenOf<"map">;
      mark: AttributesWithChildrenOf<"mark">;
      marquee: AttributesWithChildrenOf<"marquee">;
      math: AttributesWithChildrenOf<"math">;
      menu: AttributesWithChildrenOf<"menu">;
      menuitem: AttributesWithChildrenOf<"menuitem">;
      meta: AttributesOf<"meta">;
      meter: AttributesWithChildrenOf<"meter">;
      nav: AttributesWithChildrenOf<"nav">;
      nobr: AttributesWithChildrenOf<"nobr">;
      noembed: CommonAttributes;
      noframes: AttributesWithChildrenOf<"noframes">;
      noscript: AttributesWithChildrenOf<"noscript">;
      object: AttributesWithChildrenOf<"object">;
      ol: AttributesWithChildrenOf<"ol">;
      optgroup: AttributesWithChildrenOf<"optgroup">;
      option: AttributesWithChildrenOf<"option">;
      output: AttributesWithChildrenOf<"output">;
      p: AttributesWithChildrenOf<"p">;
      param: AttributesWithChildrenOf<"param">;
      picture: AttributesWithChildrenOf<"picture">;
      plaintext: AttributesWithChildrenOf<"plaintext">;
      portal: AttributesWithChildrenOf<"portal">;
      pre: AttributesWithChildrenOf<"pre">;
      progress: AttributesWithChildrenOf<"progress">;
      q: AttributesWithChildrenOf<"q">;
      rb: AttributesWithChildrenOf<"rb">;
      rp: AttributesWithChildrenOf<"rp">;
      rt: AttributesWithChildrenOf<"rt">;
      rtc: AttributesWithChildrenOf<"rtc">;
      ruby: AttributesWithChildrenOf<"ruby">;
      s: AttributesWithChildrenOf<"s">;
      samp: AttributesWithChildrenOf<"samp">;
      script: AttributesWithChildrenOf<"script">;
      section: AttributesWithChildrenOf<"section">;
      select: AttributesWithChildrenOf<"select">;
      shadow: AttributesWithChildrenOf<"shadow">;
      slot: AttributesWithChildrenOf<"slot">;
      small: AttributesWithChildrenOf<"small">;
      source: AttributesOf<"source">;
      spacer: AttributesWithChildrenOf<"spacer">;
      span: AttributesWithChildrenOf<"span">;
      strike: AttributesWithChildrenOf<"strike">;
      strong: AttributesWithChildrenOf<"strong">;
      style: AttributesWithChildrenOf<"style">;
      sub: AttributesWithChildrenOf<"sub">;
      summary: AttributesWithChildrenOf<"summary">;
      sup: AttributesWithChildrenOf<"sup">;
      table: AttributesWithChildrenOf<"table">;
      tbody: AttributesWithChildrenOf<"tbody">;
      td: AttributesWithChildrenOf<"td">;
      template: AttributesWithChildrenOf<"template">;
      textarea: AttributesWithChildrenOf<"textarea">;
      tfoot: AttributesWithChildrenOf<"tfoot">;
      th: AttributesWithChildrenOf<"th">;
      thead: AttributesWithChildrenOf<"thead">;
      time: AttributesWithChildrenOf<"time">;
      title: AttributesWithChildrenOf<"title">;
      tr: AttributesWithChildrenOf<"tr">;
      track: AttributesWithChildrenOf<"track">;
      tt: AttributesWithChildrenOf<"tt">;
      u: AttributesWithChildrenOf<"u">;
      ul: AttributesWithChildrenOf<"ul">;
      var: AttributesWithChildrenOf<"var">;
      video: AttributesWithChildrenOf<"video">;
      wbr: AttributesWithChildrenOf<"wbr">;
      xmp: AttributesWithChildrenOf<"xmp">;

      // SVG
      svg: AttributesWithChildrenOf<"svg">;
      animate: AttributesWithChildrenOf<"animate">;
      animateColor: AttributesWithChildrenOf<"animateColor">;
      animateMotion: AttributesWithChildrenOf<"animateMotion">;
      animateTransform: AttributesWithChildrenOf<"animateTransform">;
      circle: AttributesWithChildrenOf<"circle">;
      clipPath: AttributesWithChildrenOf<"clipPath">;
      "color-profile": AttributesWithChildrenOf<"color-profile">;
      defs: AttributesWithChildrenOf<"defs">;
      desc: AttributesWithChildrenOf<"desc">;
      ellipse: AttributesWithChildrenOf<"ellipse">;
      feBlend: AttributesWithChildrenOf<"feBlend">;
      feColorMatrix: AttributesWithChildrenOf<"feColorMatrix">;
      feComponentTransfer: AttributesWithChildrenOf<"feComponentTransfer">;
      feComposite: AttributesWithChildrenOf<"feComposite">;
      feConvolveMatrix: AttributesWithChildrenOf<"feConvolveMatrix">;
      feDiffuseLighting: AttributesWithChildrenOf<"feDiffuseLighting">;
      feDisplacementMap: AttributesWithChildrenOf<"feDisplacementMap">;
      feDistantLight: AttributesWithChildrenOf<"feDistantLight">;
      feFlood: AttributesWithChildrenOf<"feFlood">;
      feFuncA: AttributesWithChildrenOf<"feFuncA">;
      feFuncB: AttributesWithChildrenOf<"feFuncB">;
      feFuncG: AttributesWithChildrenOf<"feFuncG">;
      feFuncR: AttributesWithChildrenOf<"feFuncR">;
      feGaussianBlur: AttributesWithChildrenOf<"feGaussianBlur">;
      feImage: AttributesWithChildrenOf<"feImage">;
      feMerge: AttributesWithChildrenOf<"feMerge">;
      feMergeNode: AttributesWithChildrenOf<"feMergeNode">;
      feMorphology: AttributesWithChildrenOf<"feMorphology">;
      feOffset: AttributesWithChildrenOf<"feOffset">;
      fePointLight: AttributesWithChildrenOf<"fePointLight">;
      feSpecularLighting: AttributesWithChildrenOf<"feSpecularLighting">;
      feSpotLight: AttributesWithChildrenOf<"feSpotLight">;
      feTile: AttributesWithChildrenOf<"feTile">;
      feTurbulence: AttributesWithChildrenOf<"feTurbulence">;
      filter: AttributesWithChildrenOf<"filter">;
      foreignObject: AttributesWithChildrenOf<"foreignObject">;
      g: AttributesWithChildrenOf<"g">;
      image: AttributesWithChildrenOf<"image">;
      line: AttributesWithChildrenOf<"line">;
      linearGradient: AttributesWithChildrenOf<"linearGradient">;
      marker: AttributesWithChildrenOf<"marker">;
      mask: AttributesWithChildrenOf<"mask">;
      metadata: AttributesWithChildrenOf<"metadata">;
      mpath: AttributesWithChildrenOf<"mpath">;
      path: AttributesWithChildrenOf<"path">;
      pattern: AttributesWithChildrenOf<"pattern">;
      polygon: AttributesWithChildrenOf<"polygon">;
      polyline: AttributesWithChildrenOf<"polyline">;
      radialGradient: AttributesWithChildrenOf<"radialGradient">;
      rect: AttributesWithChildrenOf<"rect">;
      set: AttributesWithChildrenOf<"set">;
      stop: AttributesWithChildrenOf<"stop">;
      switch: AttributesWithChildrenOf<"switch">;
      symbol: AttributesWithChildrenOf<"symbol">;
      text: AttributesWithChildrenOf<"text">;
      textPath: AttributesWithChildrenOf<"textPath">;
      tspan: AttributesWithChildrenOf<"tspan">;
      use: AttributesWithChildrenOf<"use">;
      view: AttributesWithChildrenOf<"view">;
    }
  }
}

export interface Component<Properties = {}> {
  (properties: Properties): JSX.Node;
}

export function element(
  tag: string | Component,
  properties: Record<string, any>,
  ...children: JSX.Node[]
): JSX.Element;

export function Fragment(properties: WithChildren<{}>): DocumentFragment;

export type WithChildren<Properties> = Properties & {
  children: JSX.Node | JSX.Node[];
};

export interface StateGetter<T> {
  (): T;
  readonly raw: T;
}

export interface StateSetter<T> {
  (value: T): void;
  (fn: (old: T) => T): void;
}

export function useState<T>(
  value: T
): readonly [StateGetter<T>, StateSetter<T>];

export function useEffect(callback: () => VoidFunction | void): void;
