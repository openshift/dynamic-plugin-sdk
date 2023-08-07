import type { AnyObject } from '@monorepo/common';
import type { PluginManifest, PluginEntryModule } from '@openshift/dynamic-plugin-sdk';
import { noop } from 'lodash';

export const mockPluginManifest = ({
  name,
  version = '1.0.0',
  baseURL = `http://localhost/${name}/${version}/`,
  extensions = [],
  loadScripts = ['plugin-entry.js'],
  registrationMethod = 'callback',
}: Pick<PluginManifest, 'name'> & Partial<PluginManifest>): PluginManifest => ({
  name,
  version,
  baseURL,
  extensions,
  loadScripts,
  registrationMethod,
});

export const mockPluginEntryModule = (
  pluginModules: { [moduleRequest: string]: AnyObject } = {},
  init: PluginEntryModule['init'] = noop,
): PluginEntryModule => {
  return {
    init,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: (moduleRequest: string) => Promise.resolve(() => pluginModules[moduleRequest] as any),
  };
};
