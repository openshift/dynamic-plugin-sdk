# OpenShift Dynamic Plugin SDK

> Provides APIs, utilities and types to develop and run dynamic plugins in host web applications.

## Overview

Host applications can load and interpret plugins from remote sources at runtime by utilizing
[webpack module federation](https://webpack.js.org/concepts/module-federation/). Module federation
allows a JavaScript application to load additional code while sharing common runtime dependencies.

Both host applications and plugins can be built, released and deployed independently from each
other. This reduces the coupling between an application and its plugins and allows individual
plugins to be updated more frequently.

Tools provided by this SDK are [React](https://reactjs.org/) focused. Host applications are React
web apps built with [webpack](https://webpack.js.org/). Plugins use React APIs (hooks, components,
etc.) to extend the functionality of the application itself and/or other plugins.

## Quick References

- [Developer Setup](./docs/developer-setup.md)
- [Publishing Distributable Packages](./docs/publish-packages.md)

## Distributable Packages

Following SDK packages are distributed via [npmjs](https://www.npmjs.com/):

| Package Name | Sources |
| ------------ | ------- |
| `@openshift/dynamic-plugin-sdk` | [packages/lib-core](./packages/lib-core/) |
| `@openshift/dynamic-plugin-sdk-utils` | [packages/lib-utils](./packages/lib-utils/) |
| `@openshift/dynamic-plugin-sdk-webpack` | [packages/lib-webpack](./packages/lib-webpack/) |

Each package is versioned and published independently from other packages.
