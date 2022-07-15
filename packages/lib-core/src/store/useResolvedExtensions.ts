import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import * as React from 'react';
import type {
  Extension,
  LoadedExtension,
  ResolvedExtension,
  ExtensionPredicate,
} from '../types/extension';
import { settleAllPromises } from '../utils/promise';
import { isExtensionCodeRefsResolutionError, resolveCodeRefValues } from './coderefs';
import { usePluginStore } from './PluginStoreContext';
import { useExtensions } from './useExtensions';

type UseResolvedExtensionsResult<TExtension extends Extension> = [
  resolvedExtensions: LoadedExtension<ResolvedExtension<TExtension>>[],
  resolved: boolean,
  errors: unknown[],
];

/**
 * React hook that calls `useExtensions` and resolves all code references in all matching extensions.
 *
 * Resolving code references to the corresponding values is an asynchronous operation. Initially,
 * this hook returns a pending result tuple `[resolvedExtensions: [], resolved: false, errors: []]`.
 *
 * Once the resolution is complete, this hook re-renders the component with a result tuple containing
 * all matching extensions that had their code references resolved successfully along with any errors
 * that occurred during the process.
 *
 * When the list of matching extensions changes, the resolution is restarted.
 *
 * The hook's result tuple elements are guaranteed to be referentially stable across re-renders.
 *
 * @see {@link useExtensions}
 */
export const useResolvedExtensions = <TExtension extends Extension>(
  predicate?: ExtensionPredicate<TExtension>,
): UseResolvedExtensionsResult<TExtension> => {
  const extensions = useExtensions(predicate);
  const pluginStore = usePluginStore();

  const [resolvedExtensions, setResolvedExtensions] = React.useState<
    LoadedExtension<ResolvedExtension<TExtension>>[]
  >([]);

  const [resolved, setResolved] = React.useState<boolean>(false);
  const [errors, setErrors] = React.useState<unknown[]>([]);

  React.useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return -- this Promise never rejects
    settleAllPromises(extensions.map(resolveCodeRefValues)).then(
      ([fulfilledValues, rejectedReasons]) => {
        // eslint-disable-next-line promise/always-return -- this Promise is handled inline
        if (rejectedReasons.length > 0) {
          consoleLogger.error(
            `useResolvedExtensions has detected ${rejectedReasons.length} errors`,
            rejectedReasons,
          );

          const failedPluginNames = _.uniq(
            rejectedReasons
              .filter(isExtensionCodeRefsResolutionError)
              .map((e) => e.extension.pluginName),
          );

          pluginStore.disablePlugins(failedPluginNames, 'Code reference resolution errors');
        }

        setResolved(true);
        setResolvedExtensions(fulfilledValues);
        setErrors(rejectedReasons);
      },
    );
  }, [extensions, pluginStore]);

  return [resolvedExtensions, resolved, errors];
};
