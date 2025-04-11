export function createId(length = 10) {
  return crypto
    .getRandomValues(new Uint8Array(length))
    .reduce((accumulator, randomInteger) => {
      return accumulator + randomInteger.toString(36);
    }, "");
}
