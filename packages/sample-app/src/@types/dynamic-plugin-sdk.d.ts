import type { SupportedCustomProperties } from '../types';

declare module '@openshift/dynamic-plugin-sdk' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface PluginCustomProperties extends SupportedCustomProperties {}
}
