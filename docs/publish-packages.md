# Publishing Distributable Packages

## Check Node.js version

Use the current [Active LTS](https://nodejs.org/en/about/releases/) release.

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

## Log into npmjs account

Only members of npmjs [openshift organization](https://www.npmjs.com/org/openshift) can publish
packages maintained in this repo.

```sh
npm login --scope=@openshift
```

## Publish package(s)

To see the latest published version of the given package:

```sh
npm view $(jq -r .name < ./packages/PKG_DIR/package.json) dist-tags.latest
```

Make sure the `version` field in the relevant `package.json` file(s) has the right value:

```sh
npm pkg set version='NEW_VERSION' -workspace ./packages/PKG_DIR
```

To verify the package before publishing:

```sh
npm publish ./packages/PKG_DIR --no-git-tag-version --dry-run
```

To publish the package, run the above command without `--dry-run` parameter.
