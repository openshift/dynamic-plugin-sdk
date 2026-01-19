export interface SupportedCustomProperties {
  /** Custom properties supported by the sample application. */
  sampleApp: Partial<{
    /** Optional greeting message provided by the plugin. */
    greeting: string;
  }>;
}
