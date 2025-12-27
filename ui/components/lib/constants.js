/**
 * @enum {typeof Class[keyof typeof Class]}
 */
export const Class = Object.freeze({
  Element: "e",
  Root: "r",
  Box: "b",
  Typography: "ty",
  Text: "t",
  Image: "i",
  Svg: "s",
  Button: "bt",
  Link: "l",
  Input: "in",
  Toggle: "tg",
  File: "f",
  Video: "v",
  PositionedContainer: "pc",
  Dialog: "d",
});

/**
 * @enum {typeof CustomProperty[keyof typeof CustomProperty]}
 */
export const CustomProperty = Object.freeze({
  MeasurementUnit: "--mu",
  Direction: "--d",
  FontSize: "--fs",
  DefaultFontSize: "--dfs",
  TextSpacing: "--ts",
  RealTextHeightRatio: "--rthr",
  DefaultRealTextHeightRatio: "--drthr",
  TextSideOffsetCorrection: "--tsoc",
  DefaultTextSideOffsetCorrection: "--dtsoc",
  TextLines: "--tl",
  TextLineHeight: "--tlh",
  DefaultTextColor: "--dtc",
});
