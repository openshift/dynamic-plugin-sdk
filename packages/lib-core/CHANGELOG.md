# Changelog for `@openshift/dynamic-plugin-sdk`

## 7.0.0 - TBD

> This release contains improvements based on usage in OpenShift Console project.

- BREAKING: Replace `fixedPluginDependencyResolutions` loader option with `customDependencyResolutions` ([#291])
- Allow extending `customProperties` object type in `PluginRuntimeMetadata` ([#290])
- Update `yup` dependency to `^1.7.1` and improve handling of `Record<string, string>` schemas ([#289])
- Add `cloneDeepOnlyCloneableValues` function intended for cloning extension objects ([#294])
- Add `LoadedAndResolvedExtension` type ([#292])

## 6.0.0 - 2026-01-06

> This release adds new features, including the ability to load plugins from local manifests,
> i.e. without involving the standard webpack plugin load process. This can be used to implement
> the concept of plugins which are statically linked to the host application at its build time.
> Note that the original `PluginManifest` type has been renamed to `RemotePluginManifest`.

- Add support for optional dependencies ([#273])
- BREAKING: Add support for loading plugins from local manifests ([#281])
- BREAKING: Move plugin manifest extension post-processing to `PluginLoader.loadPlugin` ([#280])
- Improve code reference types and make them support optional chaining ([#274])

## 5.0.1 - 2024-01-15

- Ensure `transformPluginManifest` is always called before loading a plugin ([#253])

## 5.0.0 - 2023-11-03

> This release adds the ability to provide your own plugin loader implementation when creating
> the `PluginStore`. Note that the `useResolvedExtensions` hook does not automatically disable
> plugins whose extensions have code reference resolution errors.

- BREAKING: Rename `postProcessManifest` loader option to `transformPluginManifest` ([#236])
- Support passing custom plugin loader implementation to `PluginStore` ([#232])
- Add `TestPluginStore` intended for React component testing purposes ([#232])
- Add options to `useResolvedExtensions` hook to customize its default behavior ([#241])

## 4.0.0 - 2023-04-13

> This release removes the `PluginLoader` export. Pass the former `PluginLoader`
> options object as `loaderOptions` when creating the `PluginStore`.

- BREAKING: Modify `PluginStore.loadPlugin` signature to accept plugin manifest ([#212])
- BREAKING: Ensure `PluginStore.loadPlugin` returns the same Promise for pending plugins ([#212])
- BREAKING: Treat `PluginLoader` as an implementation detail of `PluginStore` ([#212])
- BREAKING: Replace `entryCallbackName` loader option with `entryCallbackSettings.name` ([#212])
- Add `entryCallbackSettings.autoRegisterCallback` loader option ([#212])
- Support tracking pending plugins via `PluginStore.getPluginInfo` ([#212])
- Provide access to raw plugin manifest in all `PluginInfoEntry` objects ([#212])
- Support CommonJS build output and improve generated Lodash imports ([#215])

## 3.0.0 - 2023-03-02

> This release adds new mandatory field to plugin manifest: `baseURL`.
> Use the `PluginLoader` option `postProcessManifest` to adapt existing manifests.

- Allow plugins to pass custom properties via plugin manifest ([#204])
- Add `sdkVersion` to `PluginStore` for better runtime diagnostics ([#200])
- Provide direct access to raw plugin manifest data ([#207])
- BREAKING: Remove `PluginStore` option `postProcessExtensions` ([#207])
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
- BREAKING: Fix `useResolvedExtensions` hook to reset result before restarting resolution ([#182])
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
[#212]: https://github.com/openshift/dynamic-plugin-sdk/pull/212
[#215]: https://github.com/openshift/dynamic-plugin-sdk/pull/215
[#232]: https://github.com/openshift/dynamic-plugin-sdk/pull/232
[#236]: https://github.com/openshift/dynamic-plugin-sdk/pull/236
[#241]: https://github.com/openshift/dynamic-plugin-sdk/pull/241
[#253]: https://github.com/openshift/dynamic-plugin-sdk/pull/253
[#273]: https://github.com/openshift/dynamic-plugin-sdk/pull/273
[#274]: https://github.com/openshift/dynamic-plugin-sdk/pull/274
[#280]: https://github.com/openshift/dynamic-plugin-sdk/pull/280
[#281]: https://github.com/openshift/dynamic-plugin-sdk/pull/281
[#289]: https://github.com/openshift/dynamic-plugin-sdk/pull/289
[#290]: https://github.com/openshift/dynamic-plugin-sdk/pull/290
[#291]: https://github.com/openshift/dynamic-plugin-sdk/pull/291
[#292]: https://github.com/openshift/dynamic-plugin-sdk/pull/292
[#294]: https://github.com/openshift/dynamic-plugin-sdk/pull/294
