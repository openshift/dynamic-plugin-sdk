# Changelog for `@openshift/dynamic-plugin-sdk`

## 2.0.0 - 2023-01-23

> This release adds new mandatory fields to the plugin manifest.
> Use the `PluginLoader` option `postProcessManifest` to adapt existing manifests.

- Support loading plugins built with webpack library type other than `jsonp` ([#182])
- Allow reloading plugins which are already loaded ([#182])
- Allow providing custom manifest object in `PluginStore.loadPlugin` ([#182])
- Provide direct access to plugin modules via `PluginStore.getExposedModule` ([#180])
- Fix `useResolvedExtensions` hook to reset result before restarting resolution ([#182])
- Ensure that all APIs referenced through the package index are exported ([#184])

## 1.0.0 - 2022-10-27

> Initial release.

[#180]: https://github.com/openshift/dynamic-plugin-sdk/pull/180
[#182]: https://github.com/openshift/dynamic-plugin-sdk/pull/182
[#184]: https://github.com/openshift/dynamic-plugin-sdk/pull/184
