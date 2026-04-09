import { consoleLogger } from '@monorepo/common';
import { useState, useEffect, useMemo } from 'react';
import type { Extension, LoadedExtension, LoadedAndResolvedExtension } from '../types/extension';
import { settleAllPromises } from '../utils/promise';
import { resolveCodeRefValues } from './coderefs';

export type UseResolvedExtensionsResult<TExtension extends Extension> = [
  resolvedExtensions: LoadedAndResolvedExtension<TExtension>[],
  resolved: boolean,
  errors: unknown[],
];

export type UseResolvedExtensionsOptions = Partial<{
  /**
   * Control how to deal with extensions that have code reference resolution errors.
   *
   * - `true` - include these extensions in the hook's result
   * - `false` - do not include these extensions in the hook's result
   *
   * Note that each code reference resolution error will cause the associated property value to be
   * set to `undefined`. Therefore, set this option to `true` only if the code that interprets the
   * extensions is able to deal with potentially `undefined` values within the `properties` object.
   *
   * Default value: `false`.
   */
  includeExtensionsWithResolutionErrors: boolean;
}>;

const defaultOptions: Required<UseResolvedExtensionsOptions> = {
  includeExtensionsWithResolutionErrors: false,
};

/**
 * React hook that resolves all code references in the provided extensions.
 *
 * Resolving code references to their corresponding values is an asynchronous operation. Initially,
 * this hook returns a pending result tuple `[resolvedExtensions: [], resolved: false, errors: []]`.
 *
 * Once the resolution is complete, this hook re-renders the component with a result tuple containing
 * extensions that had their code references resolved successfully along with any errors that occurred
 * during the process.
 *
 * When the list of provided extensions changes, the resolution is restarted. In such case, the hook
 * will _not_ re-render the component with empty initial result since it's preferable to use existing
 * state until the current resolution completes.
 *
 * This hook supports an options argument to customize its default behavior.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders, assuming referential
 * stability of all hook parameters.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const extensions = useExtensions(isSampleAppExtension);
 *   const [resolvedExtensions, resolved] = useResolvedExtensions(extensions);
 *
 *   let renderExtensions = null;
 *
 *   if (resolved) {
 *     renderExtensions = resolvedExtensions.map((e) => (
 *       <div key={e.uid}>
 *         <e.properties.component />
 *       </div>
 *     ));
 *   }
 *
 *   return renderExtensions;
 * };
 * ```
 *
 * @see {@link useExtensions}
 */
export const useResolvedExtensions = <TExtension extends Extension>(
  extensions: LoadedExtension<TExtension>[],
  options: UseResolvedExtensionsOptions = defaultOptions,
): UseResolvedExtensionsResult<TExtension> => {
  if (!Array.isArray(extensions)) {
    throw new Error('useResolvedExtensions hook requires an extensions array');
  }

  const includeExtensionsWithResolutionErrors = useMemo(
    () =>
      options?.includeExtensionsWithResolutionErrors ??
      defaultOptions.includeExtensionsWithResolutionErrors,
    [options?.includeExtensionsWithResolutionErrors],
  );

  const [resolvedExtensions, setResolvedExtensions] = useState<
    LoadedAndResolvedExtension<TExtension>[]
  >([]);

  const [resolved, setResolved] = useState<boolean>(false);
  const [errors, setErrors] = useState<unknown[]>([]);

  useEffect(() => {
    let disposed = false;

    const allResolutionErrors: unknown[] = [];
    const failedExtensionUIDs: string[] = [];

    // eslint-disable-next-line promise/catch-or-return -- this Promise never rejects
    settleAllPromises(
      extensions.map((e) =>
        resolveCodeRefValues(e, (resolutionErrors) => {
          allResolutionErrors.push(...resolutionErrors);
          failedExtensionUIDs.push(e.uid);
        }),
      ),
    ).then(([fulfilledValues]) => {
      // eslint-disable-next-line promise/always-return -- this Promise is handled inline
      if (!disposed) {
        const resultExtensions = includeExtensionsWithResolutionErrors
          ? fulfilledValues
          : fulfilledValues.filter((e) => !failedExtensionUIDs.includes(e.uid));

        setResolved(true);
        setResolvedExtensions(resultExtensions);
        setErrors(allResolutionErrors);

        if (allResolutionErrors.length > 0) {
          consoleLogger.error(
            'useResolvedExtensions has detected code reference resolution errors',
            allResolutionErrors,
          );
        }
      }
    });

    return () => {
      disposed = true;
    };
  }, [extensions, includeExtensionsWithResolutionErrors]);

  return [resolvedExtensions, resolved, errors];
};
