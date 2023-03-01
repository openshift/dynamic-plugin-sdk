# Changelog for `@openshift/dynamic-plugin-sdk`

## 3.0.0 - 2023-03-01

> This release adds new mandatory field to plugin manifest: `baseURL`.
> Use the `PluginLoader` option `postProcessManifest` to adapt existing manifests.

- Allow plugins to pass custom properties via plugin manifest ([#204])
- Add `sdkVersion` to `PluginStore` for better runtime diagnostics ([#200])
- Provide direct access to raw plugin manifest data ([#207])
- Remove `PluginStore` option `postProcessExtensions` ([#207])
- Add technical compatibility with React 18 ([#208])

## 2.0.1 - 2023-01-27

- Call `postProcessManifest` regardless of plugin manifest origin ([#190])

## 2.0.0 - 2023-01-23

> This release adds new mandatory fields to plugin manifest: `loadScripts`, `registrationMethod`.
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
[#190]: https://github.com/openshift/dynamic-plugin-sdk/pull/190
[#200]: https://github.com/openshift/dynamic-plugin-sdk/pull/200
[#204]: https://github.com/openshift/dynamic-plugin-sdk/pull/204
[#207]: https://github.com/openshift/dynamic-plugin-sdk/pull/207
[#208]: https://github.com/openshift/dynamic-plugin-sdk/pull/208
