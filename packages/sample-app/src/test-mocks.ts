import type { LocalPluginManifest } from '@openshift/dynamic-plugin-sdk';

export const mockLocalPluginManifest = ({
  name,
  version = '1.0.0',
  extensions = [],
}: Pick<LocalPluginManifest, 'name'> & Partial<LocalPluginManifest>): LocalPluginManifest => ({
  name,
  version,
  extensions,
  registrationMethod: 'local',
});
