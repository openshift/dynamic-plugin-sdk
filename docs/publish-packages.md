# Publishing Distributable Packages

## Check Node.js version

Use the [Node.js](https://nodejs.org/) version used by
[ci-operator-buildroot](../docker/Dockerfile.ci-operator-buildroot) image.

## Check npm version

To check if the current installed version is outdated:

```sh
npm outdated -g npm
```

To install the latest version:

```sh
npm install -g npm@VERSION
```

## Sync with upstream main branch

Make sure you're in sync with the upstream `main` branch:

```sh
git fetch upstream && git rebase upstream/main
```

## Build packages

To update dependencies and build all distributable SDK packages:

```sh
yarn install
yarn build-libs
```

Alternatively, you can build a specific SDK package:

```sh
(cd ./packages/PKG_DIR ; yarn build)
```

## Check package versions

Make sure the `version` field in the relevant `package.json` file(s) has the right value:

```sh
jq -r .version < ./packages/PKG_DIR/package.json
npm pkg set version=NEW_VERSION -workspace ./packages/PKG_DIR
```

Since our packages adhere to [Semantic Versioning](https://semver.org/) specification,
any backwards incompatible API changes _must_ be published under a new major version.

## Check package changelogs

If present, make sure the `CHANGELOG.md` file of the given package(s) is up to date:

- Each changelog entry describes a notable change that may impact consumers of the package.
- Each version section may contain a notice with additional information, e.g. how to upgrade
  from a previous version.

See [Common Changelog](https://common-changelog.org/) for details on good changelog practices.

## Log into npmjs account

Only members of npmjs [openshift organization](https://www.npmjs.com/org/openshift) can publish
packages maintained in this repo.

```sh
npm login --scope=@openshift
```

## Publish packages

To see the latest published version of the given package:

```sh
npm view $(jq -r .name < ./packages/PKG_DIR/package.json) dist-tags.latest
```

To verify the package before publishing:

```sh
npm publish ./packages/PKG_DIR --no-git-tag-version --dry-run
```

To publish the package, run the above command without `--dry-run` parameter.
