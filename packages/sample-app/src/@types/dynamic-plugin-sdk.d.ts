import '@openshift/dynamic-plugin-sdk';

declare module '@openshift/dynamic-plugin-sdk' {
  interface PluginCustomProperties {
    sampleApp: {
      /** What kind of lunch the plugin author wants to eat */
      lunch: string;
    };
  }
}
