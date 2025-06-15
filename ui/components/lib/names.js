/**
 * @enum {typeof Class[keyof typeof Class]}
 */
export const Class = Object.freeze({
  Element: "mu-element",
  Root: "mu-root",
  Box: "mu-box",
  TextualElement: "mu-textual-element",
  Text: "mu-text",
  Image: "mu-image",
  Svg: "mu-svg",
  Button: "mu-button",
  Link: "mu-link",
  Input: "mu-input",
  Toggle: "mu-toggle",
  File: "mu-file",
  Video: "mu-video",
  PositionedContainer: "mu-positioned-container",
});

/**
 * @enum {typeof CustomProperty[keyof typeof CustomProperty]}
 */
export const CustomProperty = Object.freeze({
  Direction: "--mu-direction",
  HorizontalAlignment: "--mu-align-x",
  VerticalAlignment: "--mu-align-y",
  Width: "--mu-width",
  Height: "--mu-height",
  MinWidth: "--mu-min-width",
  MinHeight: "--mu-min-height",
  Spacing: "--mu-spacing",
  Padding: "--mu-padding",
  PaddingTop: "--mu-padding-top",
  PaddingRight: "--mu-padding-right",
  PaddingBottom: "--mu-padding-bottom",
  PaddingLeft: "--mu-padding-left",
  HorizontalMovement: "--mu-move-x",
  VerticalMovement: "--mu-move-y",
  HorizontalClip: "--mu-clip-x",
  VerticalClip: "--mu-clip-y",
  Scaling: "--mu-scale",
  Rotation: "--mu-rotation",
  Position: "--mu-position",
  PositionTopOffset: "--mu-top",
  PositionBottomOffset: "--mu-bottom",
  PositionLeftOffset: "--mu-left",
  PositionRightOffset: "--mu-right",
  PositionAxisOffset: "--mu-z-index",
  Background: "--mu-background",
  FontSize: "--mu-font-size",
  Colour: "--mu-colour",
  FontWeight: "--mu-font-weight",
  FontFamily: "--mu-font-family",
  TextSpacing: "--mu-text-spacing",
  TextDensity: "--mu-text-density",
  TextWhiteSpace: "--mu-text-white-space",
  TextOverflowWrap: "--mu-text-overflow-wrap",
  RealTextHeightRatio: "--mu-real-text-height-ratio",
  TextSideOffsetCorrection: "--mu-text-side-offset-correction",
  ImageFit: "--mu-image-fit",
  TextLineHeight: "--mu-text-line-height",
  TextLines: "--mu-text-lines",
  Rounded: "--mu-rounded",
  Border: "--mu-border",
  BorderWidth: "--mu-border-width",
  BorderStyle: "--mu-border-style",
  BorderColour: "--mu-border-colour",
  Shadow: "--mu-shadow",
  PositionedHeight: "--mu-positioned-height",
  PositionedWidth: "--mu-positioned-width",
  Hidden: "--mu-hidden",
});

/**
 * @enum {typeof PrivateProperties[keyof typeof PrivateProperties]}
 */
export const PrivateProperties = Object.freeze({
  TypeOf: "__typeof-slkjs9d662",
});
