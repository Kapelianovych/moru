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
});
