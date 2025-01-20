/**
 * @import { UrlCreator } from './location.js';
 * @import { VirtualFile } from './virtual-file.js';
 * @import { Options, BuildStore, LocalThis } from './options.js';
 */

/**
 * @template R
 * @callback AsyncBuildJsRunner
 * @param {LocalThis} props
 * @param {LocalThis} localThis
 * @param {BuildStore} buildStore
 * @param {UrlCreator} url
 * @param {Options["dynamicallyImportJsFile"]} dynamicallyImportJsFile
 * @returns {Promise<R>}
 */

const CALCULATION_RESULT_VARIABLE_NAME = "___$0$___18k5i4_625_";

/**
 * @param {string} code
 * @param {Array<[string, isConstant: boolean]>} globalVariables
 * @returns {AsyncBuildJsRunner<void>}
 */
export function createAsyncStatementsJsRunner(code, globalVariables) {
  const [definitions, assignments] =
    generatePseudoGlobalDefinitions(globalVariables);

  return /** @type {AsyncBuildJsRunner<void>} */ (
    new Function(
      "props",
      "localThis",
      "buildStore",
      "url",
      "dynamicallyImportJsFile",
      `return (async () => {
        ${definitions}
        ${code}
        ${assignments}
      })()`,
    )
  );
}

/**
 * @param {string} code
 * @param {Array<[string, isConstant: boolean]>} globalVariables
 * @returns {AsyncBuildJsRunner<unknown>}
 */
export function createAsyncExpressionJsRunner(code, globalVariables) {
  const [definitions, assignments] =
    generatePseudoGlobalDefinitions(globalVariables);

  return /** @type {AsyncBuildJsRunner<unknown>} */ (
    new Function(
      "props",
      "localThis",
      "buildStore",
      "url",
      "dynamicallyImportJsFile",
      `return (async () => {
        ${definitions}
        const ${CALCULATION_RESULT_VARIABLE_NAME} = ${code};
        ${assignments}
        return ${CALCULATION_RESULT_VARIABLE_NAME};
      })()`,
    )
  );
}

/**
 * @param {LocalThis} localThis
 * @returns {Array<[string, isConstant: boolean]>}
 */
export function collectGlobalVariablesForJsRunner(localThis) {
  return Reflect.ownKeys(localThis).map((key) => {
    // We are iterating over own keys already, so descriptor is guaranteed to be defined.
    const descriptor = /** @type {TypedPropertyDescriptor<unknown>} */ (
      Reflect.getOwnPropertyDescriptor(localThis, key)
    );

    return [/** @type {string} */ (key), !(descriptor.writable ?? true)];
  });
}

/**
 * @param {Array<[string, isConstant: boolean]>} globalVariables
 * @returns {[string, string]}
 */
function generatePseudoGlobalDefinitions(globalVariables) {
  return globalVariables.reduce(
    ([definitions, assignments], [key, isConstant]) => {
      return [
        definitions +
          `${isConstant ? "const" : "let"} ${key} = localThis["${key}"];`,
        isConstant
          ? assignments
          : assignments + `localThis["${key}"] = ${key};`,
      ];
    },
    ["", ""],
  );
}
