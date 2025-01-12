import type { UrlCreator } from "./location.js";
import type { BuildStore, Options } from "./options.js";

export interface AsyncBuildJsRunner<R> {
  (
    props: Options["properties"],
    localThis: Record<string, unknown>,
    buildStore: BuildStore,
    url: UrlCreator,
    dynamicallyImportJsFile: Options["dynamicallyImportJsFile"],
  ): Promise<R>;
}

export function createAsyncStatementsJsRunner(
  code: string,
  globalVariables: Array<string>,
): AsyncBuildJsRunner<void> {
  const definitions = generatePseudoGlobalDefinitions(globalVariables);

  return new Function(
    "props",
    "localThis",
    "buildStore",
    "url",
    "dynamicallyImportJsFile",
    `return (async () => {${definitions}${code}})()`,
  ) as AsyncBuildJsRunner<void>;
}

export function createAsyncExpressionJsRunner(
  code: string,
  globalVariables: Array<string>,
): AsyncBuildJsRunner<unknown> {
  const definitions = generatePseudoGlobalDefinitions(globalVariables);

  return new Function(
    "props",
    "localThis",
    "buildStore",
    "url",
    "dynamicallyImportJsFile",
    `return (async () => {${definitions}return ${code}})()`,
  ) as AsyncBuildJsRunner<unknown>;
}

function generatePseudoGlobalDefinitions(
  globalVariables: Array<string>,
): string {
  return globalVariables.reduce((code, key) => {
    return code + `const ${key} = localThis["${key}"];`;
  }, "");
}
