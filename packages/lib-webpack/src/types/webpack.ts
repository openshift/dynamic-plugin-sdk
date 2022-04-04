/**
 * webpack `SharedConfig` type.
 *
 * Advanced configuration for modules that should be shared in the share scope.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
export type WebpackSharedConfig = {
  eager?: boolean;
  import?: string | false;
  packageName?: string;
  requiredVersion?: string | false;
  shareKey?: string;
  shareScope?: string;
  singleton?: boolean;
  strictVersion?: boolean;
  version?: string | false;
};

/**
 * webpack `SharedObject` type.
 *
 * Modules that should be shared in the share scope.
 */
export type WebpackSharedObject = {
  [index: string]: string | WebpackSharedConfig;
};
