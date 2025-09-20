import { CustomProperty } from "../constants.js";
import { compileCss, createSinglePropertyTransformer } from "../compile-css.js";

/**
 * @param {string | undefined} moveLeft
 * @param {string | undefined} moveRight
 * @param {string | undefined} moveUp
 * @param {string | undefined} moveDown
 * @param {string | undefined} scale
 * @param {string | undefined} rotate
 * @returns {string}
 */
export function compileTransformProperties(
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
  scale,
  rotate,
) {
  const transformProperty = `
    transform:
      translate(var(${CustomProperty.HorizontalMovement}), var(${CustomProperty.VerticalMovement}))
      scale(var(${CustomProperty.Scale}))
      rotate(var(${CustomProperty.Rotate}));
  `;

  const horizontalMovementCss = compileMovement(
    moveLeft,
    moveRight,
    CustomProperty.HorizontalMovement,
    "--t-ml",
    "--t-mr",
  );
  const verticalMovementCss = compileMovement(
    moveUp,
    moveDown,
    CustomProperty.VerticalMovement,
    "--t-mu",
    "--t-md",
  );
  const scaleCss = compileCss(
    scale,
    createSinglePropertyTransformer(CustomProperty.Scale),
  );
  const rotateCss = compileCss(
    rotate,
    createSinglePropertyTransformer(CustomProperty.Rotate),
  );

  if (horizontalMovementCss || verticalMovementCss || scaleCss || rotateCss) {
    return `
      ${horizontalMovementCss || ""}
      ${verticalMovementCss || ""}
      ${scaleCss || ""}
      ${rotateCss || ""}
      ${transformProperty}
    `;
  }

  return "";
}

/**
 * @param {string | undefined} moveStart
 * @param {string | undefined} moveEnd
 * @param {string} finalPropertyName
 * @param {string} startTemporaryPropertyName
 * @param {string} endTemporaryPropertyName
 * @returns {string}
 */
function compileMovement(
  moveStart,
  moveEnd,
  finalPropertyName,
  startTemporaryPropertyName,
  endTemporaryPropertyName,
) {
  const moveStartCss = compileCss(
    moveStart,
    createSinglePropertyTransformer(startTemporaryPropertyName, (value) => {
      return `calc(-1 * ${value})`;
    }),
  );

  const moveEndCss = compileCss(
    moveEnd,
    createSinglePropertyTransformer(endTemporaryPropertyName),
  );

  if (moveStartCss || moveEndCss) {
    const startVariable = `var(${startTemporaryPropertyName})`;
    const endVariable = `var(${endTemporaryPropertyName})`;
    const value =
      moveStartCss && moveEndCss
        ? `calc(${startVariable} + ${endVariable})`
        : moveStartCss
          ? startVariable
          : endVariable;

    return `
      ${moveStartCss || ""}
      ${moveEndCss || ""}
      ${finalPropertyName}: ${value};
    `;
  }

  return "";
}
