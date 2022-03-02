# OpenShift Dynamic Plugin SDK

> Provides APIs, utilities and types to develop and run dynamic plugins in host web applications.

## Developer Setup

### Dependencies

1. [Node.js](https://nodejs.org/) - [Active LTS](https://nodejs.org/en/about/releases/) release
2. [Yarn](https://yarnpkg.com/getting-started/install) - standard per-project install
```
npm install -g yarn
```

## Distributable Packages

Following packages are distributed via [npm registry](https://www.npmjs.com/):

| Package Name | Description |
| ------------ | ----------- |
| `@openshift/dynamic-plugin-sdk` | Allows loading, managing and interpreting plugins. |
| `@openshift/dynamic-plugin-sdk-utils` | Provides Kubernetes and React utilities. |
| `@openshift/dynamic-plugin-sdk-webpack` | Allows building plugin assets with webpack. |

Each package is versioned and published independently from other packages.

## Publishing Packages

### Update npm

Make sure the `npm` package manager that comes with Node.js is up-to-date.

To see the current installed version:

```sh
npm ls -g npm
```

To check if the current installed version is outdated:

```sh
npm outdated -g npm
```

To install the latest version:

```sh
npm install -g npm@<version>
```

### Log into npmjs account

Only members of npmjs [openshift organization](https://www.npmjs.com/org/openshift) can publish
packages maintained in this repo.

```sh
npm login
```

### Publish a package

To publish the given package using the current version as specified in its `package.json`:

```sh
npm publish packages/lib-<pkg> --no-git-tag-version
```

To publish a package under a different version and update its `package.json` accordingly:

```sh
npm publish packages/lib-<pkg> --no-git-tag-version --new-version <version>
```

It's recommended to add `--dry-run` to `npm publish` command prior to actual publish.
