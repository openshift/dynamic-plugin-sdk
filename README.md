# OpenShift Dynamic Plugin SDK

> Provides APIs, utilities and types to develop and run dynamic plugins in host web applications.

## Overview

Host applications can load and interpret plugins from remote sources at runtime by utilizing
[webpack module federation][webpack-module-federation]. Module federation allows a JavaScript
application to load and execute additional code while sharing common runtime dependencies.

Both host applications and plugins can be built, released and deployed independently from each
other. This reduces the coupling between an application and its plugins and allows individual
plugins to be updated and deployed more frequently.

Tools provided by this SDK are [React](https://reactjs.org/) focused and support [webpack][webpack]
and [rspack][rspack] module bundlers. Plugins use `DynamicRemotePlugin` to generate their assets.
Both host applications and plugins use React APIs such as hooks, components, etc.

## Quick References

- [Dynamic Plugins Overview](./docs/plugins-overview.md)
- [Developer Setup](./docs/developer-setup.md)
- [Publishing Distributable Packages](./docs/publish-packages.md)

## Distributable Packages

Following SDK packages are distributed via [npmjs](https://www.npmjs.com/) registry:

| Package Name                               | Sources                                             |
| ------------------------------------------ | --------------------------------------------------- |
| `@openshift/api-types`                     | [packages/lib-api-types](./packages/lib-api-types/) |
| `@openshift/dynamic-plugin-sdk`            | [packages/lib-core](./packages/lib-core/)           |
| `@openshift/dynamic-plugin-sdk-utils`      | [packages/lib-utils](./packages/lib-utils/)         |
| `@openshift/dynamic-plugin-sdk-webpack`    | [packages/lib-webpack](./packages/lib-webpack/)     |

Each package is versioned and published independently.

[webpack]: https://webpack.js.org/
[webpack-module-federation]: https://webpack.js.org/concepts/module-federation/
[rspack]: https://rspack.rs/
