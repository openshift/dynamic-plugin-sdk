import type { PluginManifest } from '../shared-webpack';

/**
 * Load a script from the given URL by injecting new HTML `script` element into the document.
 */
export const injectScriptElement = (
  url: string,
  _manifest: PluginManifest,
  id: string,
  getDocument = () => document,
) =>
  new Promise<void>((resolve, reject) => {
    const script = getDocument().createElement('script');

    script.async = true;
    script.src = url;
    script.id = id;

    script.onload = () => {
      resolve();
    };

    script.onerror = (event) => {
      reject(event);
    };

    getDocument().head.appendChild(script);
  });

/**
 * Get the corresponding HTML `script` element or `null` if not present in the document.
 */
export const getScriptElement = (id: string, getDocument = () => document) => {
  let document;
  try {
    document = getDocument();
    return Array.from(document.scripts).find((script) => script.id === id) ?? null;
  } catch {
    // Cover environments that do co not contain document
    return null;
  }
};
