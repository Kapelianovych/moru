/**
 * @typedef {Object} ImageUrlDescriptor
 * @property {string} url
 * @property {`${number}${'w' | 'x'}`} condition
 */

/**
 * @typedef {Object} ImageDescriptor
 * @property {string} [type]
 * @property {string} [media]
 * @property {Array<string>} [sizes]
 * @property {Array<string | ImageUrlDescriptor>} urls
 */

/**
 * @typedef {Pick<ImageDescriptor, 'urls' | 'sizes'>} FallbackImageDescriptor
 */

/**
 * @param {ImageDescriptor['urls']} urls
 * @returns {string}
 */
function stringifySrcset(urls) {
  return urls.reduce(
    /**
     * @param {string} accumulator
     * @param {ImageDescriptor['urls'][number]} urlOrPair
     * @returns {string}
     */
    (accumulator, urlOrPair) => {
      if (accumulator.length) {
        accumulator += ", ";
      }

      if (typeof urlOrPair === "string") {
        accumulator += urlOrPair;
      } else {
        accumulator += `${urlOrPair.url} ${urlOrPair.condition}`;
      }

      return accumulator;
    },
    "",
  );
}

/**
 * @typedef {Object} ImageSourceAttributes
 * @property {string} type
 * @property {string} media
 * @property {string} srcset
 */

/**
 * @typedef {Object} ImageAttributes
 * @property {string} [src]
 * @property {string} [sizes]
 * @property {string} [srcset]
 */

/**
 * @param {ImageDescriptor} imageDescriptor
 * @returns {Object}
 */
export function createAttributesForSourceElement(imageDescriptor) {
  return {
    type: imageDescriptor.type,
    media: imageDescriptor.media,
    srcset: stringifySrcset(imageDescriptor.urls),
  };
}

/**
 * @param {FallbackImageDescriptor} fallbackImageDescriptor
 * @returns {ImageAttributes}
 */
export function createAttributesForFallbackElement(fallbackImageDescriptor) {
  /**
   * @type {ImageAttributes}
   */
  const attributes = {};

  attributes.srcset = stringifySrcset(fallbackImageDescriptor.urls);

  if (fallbackImageDescriptor.sizes) {
    attributes.sizes = fallbackImageDescriptor.sizes.join(", ");
  }

  return attributes;
}
