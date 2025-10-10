import '@openshift/dynamic-plugin-sdk';

declare module '@openshift/dynamic-plugin-sdk' {
  interface CustomPluginData {
    /** What the plugin had for lunch */
    lunch: string;
  }
}
