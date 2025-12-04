# Changelog for `@openshift/dynamic-plugin-sdk-webpack`

## 4.1.0 - 2024-04-26

- Allow overriding core webpack module federation plugins used by DynamicRemotePlugin ([#259])

## 4.0.2 - 2024-03-05

- Exclude non-user-facing chunk files like `[id].[fullhash].hot-update.js` from processing ([#256])

## 4.0.1 - 2023-11-27

- Fix bug in `DynamicRemotePlugin` where the plugin manifest may refer to incorrect entry script ([#250])

## 4.0.0 - 2023-11-03

> Any custom properties in the plugin manifest should be set via the `customProperties` object.
> Use the `DynamicRemotePlugin` option `transformPluginManifest` to add such custom properties
> to the generated plugin manifest.

- Add `transformPluginManifest` option to `DynamicRemotePlugin` ([#236])
- BREAKING: Rename `sharedScope` to `sharedScopeName` in `moduleFederationSettings` ([#236])
- Validate values of plugin metadata `dependencies` object as semver ranges ([#239])
- BREAKING: Disallow empty strings as values of plugin metadata `dependencies` object ([#240])
- Fix bug in `DynamicRemotePlugin` where `buildHash` in plugin manifest is not generated properly ([#227])

## 3.0.1 - 2023-04-13

- Fix bug in `DynamicRemotePlugin` that occurs with webpack `createChildCompiler` usage ([#213])
- Support CommonJS build output and improve generated Lodash imports ([#215])

## 3.0.0 - 2023-03-02

- Add base URL for plugin assets to plugin manifest ([#206])
- BREAKING: Make `DynamicRemotePlugin` options `pluginMetadata` and `extensions` mandatory ([#207])
- BREAKING: Replace `DynamicRemotePlugin` option `moduleFederationLibraryType` with `moduleFederationSettings` ([#199])
- Allow building plugins which do not provide any exposed modules ([#199])

## 2.0.0 - 2023-01-23

- Support building plugins using webpack library type other than `jsonp` ([#182])
- BREAKING: Emit error when a separate runtime chunk is used with `jsonp` library type ([#182])
- Allow customizing the filename of entry script and plugin manifest ([#182])
- Ensure that all APIs referenced through the package index are exported ([#184])

## 1.0.0 - 2022-10-27

> Initial release.

[#182]: https://github.com/openshift/dynamic-plugin-sdk/pull/182
[#184]: https://github.com/openshift/dynamic-plugin-sdk/pull/184
[#199]: https://github.com/openshift/dynamic-plugin-sdk/pull/199
[#206]: https://github.com/openshift/dynamic-plugin-sdk/pull/206
[#207]: https://github.com/openshift/dynamic-plugin-sdk/pull/207
[#213]: https://github.com/openshift/dynamic-plugin-sdk/pull/213
[#215]: https://github.com/openshift/dynamic-plugin-sdk/pull/215
[#227]: https://github.com/openshift/dynamic-plugin-sdk/pull/227
[#236]: https://github.com/openshift/dynamic-plugin-sdk/pull/236
[#239]: https://github.com/openshift/dynamic-plugin-sdk/pull/239
[#240]: https://github.com/openshift/dynamic-plugin-sdk/pull/240
[#250]: https://github.com/openshift/dynamic-plugin-sdk/pull/250
[#256]: https://github.com/openshift/dynamic-plugin-sdk/pull/256
[#259]: https://github.com/openshift/dynamic-plugin-sdk/pull/259
