# Developer Setup

## Prerequisites

- [Node.js](https://nodejs.org/) current [Active LTS](https://nodejs.org/en/about/releases/) release
- [Yarn](https://yarnpkg.com/getting-started/install) package manager

## GitHub repo setup

```sh
git clone https://github.com/openshift/dynamic-plugin-sdk.git
cd dynamic-plugin-sdk
git remote rename origin upstream
git remote add USER https://github.com/USER/dynamic-plugin-sdk.git
```

## Steps after cloning

```sh
yarn install
yarn build-libs
```

Alternatively, run `test.sh` which builds, lints and tests all the packages.

## Lint specific file paths

```sh
yarn eslint path/to/lint
```
