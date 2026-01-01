const pathnameParameterRe = /:([^/:\\]+):?/g;

/**
 * @param {string} pathname
 * @param {boolean} exact
 * @returns {RegExp}
 */
export function pathToRegExp(pathname, exact) {
  let preparedPathname = pathname.replaceAll("/", "\\/");

  if (preparedPathname.endsWith("/")) {
    preparedPathname += "?";
  } else {
    preparedPathname += "\\/?";
  }

  preparedPathname = preparedPathname.replaceAll(
    pathnameParameterRe,
    "(?<$1>[^/]+)",
  );

  return new RegExp(`^${preparedPathname}${exact ? "(?:$|\\?)" : ""}`);
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
