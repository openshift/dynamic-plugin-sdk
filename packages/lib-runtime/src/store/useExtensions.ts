import * as _ from 'lodash-es';
import * as React from 'react';
import type { Extension, LoadedExtension, ExtensionPredicate } from '../types/extension';
import type { PluginConsumer } from '../types/store';
import { PluginEventType } from '../types/store';
import { usePluginSubscription } from './usePluginSubscription';

/**
 * React hook for consuming extensions which are currently in use.
 *
 * The optional `predicate` parameter may be used to filter resulting extensions.
 *
 * This hook re-renders the component whenever the list of matching extensions changes.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 */
export const useExtensions = <TExtension extends Extension>(
  predicate?: ExtensionPredicate<TExtension>,
): LoadedExtension<TExtension>[] => {
  const getData = React.useCallback(
    (pluginConsumer: PluginConsumer) => pluginConsumer.getExtensions(),
    [],
  );

  const eventTypes = React.useMemo(() => [PluginEventType.ExtensionsChanged], []);

  const extensions = usePluginSubscription(getData, _.isEqual, eventTypes);

  const filteredExtensions = React.useMemo(
    () =>
      extensions.reduce(
        (acc, e) => ((predicate ?? (() => true))(e) ? [...acc, e] : acc),
        [] as LoadedExtension<TExtension>[],
      ),
    [extensions, predicate],
  );

  return filteredExtensions;
};
