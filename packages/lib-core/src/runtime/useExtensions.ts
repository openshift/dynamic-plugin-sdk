import { isEqualWith } from 'lodash';
import { useMemo } from 'react';
import type { Extension, LoadedExtension, ExtensionPredicate } from '../types/extension';
import type { PluginStoreInterface } from '../types/store';
import { PluginEventType } from '../types/store';
import { usePluginSubscription } from './usePluginSubscription';

const eventTypes = [PluginEventType.ExtensionsChanged];

const getData = (pluginStore: PluginStoreInterface) => pluginStore.getExtensions();

const isSameData = (prevData: LoadedExtension[], nextData: LoadedExtension[]) =>
  isEqualWith(prevData, nextData, (a, b) => a === b);

/** Create a predicate that matches any extension */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyPredicate = (() => true) as unknown as ExtensionPredicate<any>;

/**
 * React hook for consuming extensions which are currently in use.
 *
 * The optional `predicate` parameter may be used to filter resulting extensions.
 *
 * This hook re-renders the component whenever the list of matching extensions changes.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders,
 * given predicate is also referentially stable (e.g., it is a module-level constant
 * or memoized).
 */
export const useExtensions = <TExtension extends Extension>(
  predicate: ExtensionPredicate<TExtension> = anyPredicate,
): LoadedExtension<TExtension>[] => {
  const extensions = usePluginSubscription(eventTypes, getData, isSameData);

  return useMemo(
    () => extensions.filter(predicate as ExtensionPredicate<LoadedExtension<TExtension>>),
    [extensions, predicate],
  );
};
