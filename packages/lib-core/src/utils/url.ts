import * as _ from 'lodash-es';

/**
 * Return `true` if the given URL is absolute.
 *
 * @see https://stackoverflow.com/a/38979205
 */
export const isAbsoluteURL = (url: string) => url.indexOf('://') > 0 || url.indexOf('//') === 0;

/**
 * Resolve URL to the given resource using a base URL.
 *
 * If `base` is not an absolute URL, it's considered to be relative to the document origin.
 *
 * If `to` is an absolute URL, `base` is ignored (as per standard {@link URL} constructor semantics).
 */
export const resolveURL = (
  base: string,
  to: string,
  processURL: (url: URL) => URL = _.identity,
  getDocumentOrigin = () => window.location.origin,
) =>
  processURL(
    new URL(to, isAbsoluteURL(base) ? base : new URL(base, getDocumentOrigin())),
  ).toString();
