import type { Extension, LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { cloneDeepOnlyCloneableValues, visitDeep } from '@openshift/dynamic-plugin-sdk';
import { useMemo } from 'react';

const replaceValues: Record<string, string> = {
  APP_NAME: 'Sample Application',
};

const replacePlaceholders = (text: string) => {
  let result = text;

  Array.from(text.matchAll(/%[^%\s]+%/g))
    .map((match) => match[0])
    .forEach((placeholder) => {
      const key = placeholder.slice(1, -1);
      const value = replaceValues[key];

      if (value) {
        result = result.replace(placeholder, value);
      }
    });

  return result;
};

const isString = (obj: unknown): obj is string => typeof obj === 'string';

/**
 * React hook that replaces `%key%` placeholders within each extension's `properties` object.
 *
 * Modifying the original extension objects is strongly discouraged. This hook is an example on how
 * to implement custom extension transformations by cloning extensions and modifying their properties.
 */
export const useReplaceTextExtensions = <TExtension extends Extension>(
  extensions: LoadedExtension<TExtension>[],
): LoadedExtension<TExtension>[] => {
  return useMemo(
    () =>
      extensions.map((e) => {
        const clonedExtension = cloneDeepOnlyCloneableValues(e);

        visitDeep<string>(clonedExtension.properties, isString, (value, key, obj) => {
          const newValue = replacePlaceholders(value);

          if (newValue !== value) {
            // eslint-disable-next-line no-param-reassign
            obj[key] = newValue;
          }
        });

        return clonedExtension;
      }),
    [extensions],
  );
};
