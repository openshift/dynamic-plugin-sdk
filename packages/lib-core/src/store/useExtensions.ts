import * as _ from 'lodash-es';
import * as React from 'react';
import type { Extension, LoadedExtension, ExtensionPredicate } from '../types/extension';
import type { PluginStoreInterface } from '../types/store';
import { PluginEventType } from '../types/store';
import { usePluginSubscription } from './usePluginSubscription';

const eventTypes = [PluginEventType.ExtensionsChanged];

const getData = (pluginStore: PluginStoreInterface) => pluginStore.getExtensions();

const isSameData = (prevData: LoadedExtension[], nextData: LoadedExtension[]) =>
  _.isEqualWith(prevData, nextData, (a, b) => a === b);

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
  const extensions = usePluginSubscription(eventTypes, getData, isSameData);

  return React.useMemo(
    () =>
      extensions.reduce<LoadedExtension<TExtension>[]>(
        (acc, e) => ((predicate ?? (() => true))(e) ? [...acc, e] : acc),
        [],
      ),
    [extensions, predicate],
  );
};
