export const Fragment = Symbol();

export function isJSX(value) {
  return Boolean(value?.$tag);
}

export function jsx($tag, $properties, key) {
  if (key !== undefined)
    // We treat key as a regular property.
    $properties.key = key;

  return $tag === Fragment
    ? $properties.children
    : {
        $tag,
        $properties,
      };
}
