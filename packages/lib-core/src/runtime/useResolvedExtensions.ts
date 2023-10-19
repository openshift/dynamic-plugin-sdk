import { consoleLogger } from '@monorepo/common';
import * as React from 'react';
import type {
  Extension,
  LoadedExtension,
  ResolvedExtension,
  ExtensionPredicate,
} from '../types/extension';
import { settleAllPromises } from '../utils/promise';
import { resolveCodeRefValues } from './coderefs';
import { useExtensions } from './useExtensions';

export type UseResolvedExtensionsResult<TExtension extends Extension> = [
  resolvedExtensions: LoadedExtension<ResolvedExtension<TExtension>>[],
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

/**
 * React hook that calls `useExtensions` and resolves all code references in all matching extensions.
 *
 * Resolving code references to their corresponding values is an asynchronous operation. Initially,
 * this hook returns a pending result tuple `[resolvedExtensions: [], resolved: false, errors: []]`.
 *
 * Once the resolution is complete, this hook re-renders the component with a result tuple containing
 * all matching extensions that had their code references resolved successfully along with any errors
 * that occurred during the process.
 *
 * This hook supports an options argument to customize its default behavior.
 *
 * When the list of matching extensions changes, the resolution is restarted.
 *
 * The hook's result tuple elements are guaranteed to be referentially stable across re-renders.
 *
 * @see {@link useExtensions}
 */
export const useResolvedExtensions = <TExtension extends Extension>(
  predicate?: ExtensionPredicate<TExtension>,
  options: UseResolvedExtensionsOptions = {},
): UseResolvedExtensionsResult<TExtension> => {
  const hookOptions: Required<UseResolvedExtensionsOptions> = {
    includeExtensionsWithResolutionErrors: options.includeExtensionsWithResolutionErrors ?? false,
  };

  const { includeExtensionsWithResolutionErrors } = hookOptions;
  const extensions = useExtensions(predicate);

  const [resolvedExtensions, setResolvedExtensions] = React.useState<
    LoadedExtension<ResolvedExtension<TExtension>>[]
  >([]);

  const [resolved, setResolved] = React.useState<boolean>(false);
  const [errors, setErrors] = React.useState<unknown[]>([]);

  React.useEffect(() => {
    const pluginErrors: { [pluginName: string]: unknown[] } = {};
    const failedExtensionUIDs: string[] = [];

    // eslint-disable-next-line promise/catch-or-return -- this Promise never rejects
    settleAllPromises(
      extensions.map((e) =>
        resolveCodeRefValues(e, (resolutionErrors) => {
          pluginErrors[e.pluginName] ??= [];
          pluginErrors[e.pluginName].push(...resolutionErrors);
          failedExtensionUIDs.push(e.uid);
        }),
      ),
    ).then(([fulfilledValues]) => {
      const failedPluginNames = Object.keys(pluginErrors);
      const allResolutionErrors = Object.values(pluginErrors).flat();

      if (failedPluginNames.length > 0) {
        consoleLogger.error(
          'useResolvedExtensions has detected code reference resolution errors',
          allResolutionErrors,
        );
      }

      // eslint-disable-next-line promise/always-return -- this Promise is handled inline
      const resultExtensions = includeExtensionsWithResolutionErrors
        ? fulfilledValues
        : fulfilledValues.filter((e) => !failedExtensionUIDs.includes(e.uid));

      setResolved(true);
      setResolvedExtensions(resultExtensions);
      setErrors(allResolutionErrors);
    });

    return () => {
      setResolved(false);
      setResolvedExtensions([]);
      setErrors([]);
    };
  }, [extensions, includeExtensionsWithResolutionErrors]);

  return [resolvedExtensions, resolved, errors];
};
