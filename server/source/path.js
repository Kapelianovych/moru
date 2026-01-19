const pathnameParameterRe = /:(.+?)(?::|\\\/|$)/g;
const pathnameTakeAllParameterRe = /\\\.\\\.\\\.(.+)/g;
const specialReSymbolsToEscape = /[.[\]()*{}/]/g;

/**
 * @param {string} pathname
 * @returns {RegExp}
 */
export function pathToRegExp(pathname) {
  let preparedPathname = pathname
    .replaceAll(specialReSymbolsToEscape, "\\$&")
    .replaceAll(pathnameParameterRe, "(?<$1>.+)")
    .replaceAll(pathnameTakeAllParameterRe, "(?<$1>.+)");

  if (preparedPathname.endsWith("/")) {
    preparedPathname += "?";
  } else {
    preparedPathname += "\\/?";
  }

  return new RegExp(`^${preparedPathname}(?:$|\\?)`);
}

/**
 * @param {RegExp} pathRegExp
 * @param {string} path
 * @returns {Record<string, string>}
 */
export function extractPathParameters(pathRegExp, path) {
  const match = pathRegExp.exec(path);

  return match?.groups ?? {};
}
