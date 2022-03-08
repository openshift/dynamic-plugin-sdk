# Developer Setup

## Prerequisites

- [Node.js](https://nodejs.org/) current [Active LTS](https://nodejs.org/en/about/releases/) release
- [Yarn](https://yarnpkg.com/getting-started/install) package manager

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
