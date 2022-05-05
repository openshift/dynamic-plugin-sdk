# Developer Setup

## Prerequisites

- [Node.js](https://nodejs.org/) current [Active LTS](https://nodejs.org/en/about/releases/) release
- [Yarn](https://yarnpkg.com/getting-started/install) package manager

## GitHub repo setup

Fork the upstream [OpenShift Dynamic Plugin SDK](https://github.com/openshift/dynamic-plugin-sdk) repo,
then `git clone` your forked repo. Refer to [GitHub docs](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
for details.

We suggest renaming the Git remote representing the upstream repo to `upstream`. For example, assuming
your GitHub user name is `your_user_name`:

```
$ git remote -v
upstream        https://github.com/openshift/dynamic-plugin-sdk.git (fetch)
upstream        https://github.com/openshift/dynamic-plugin-sdk.git (push)
your_user_name  https://github.com/your_user_name/dynamic-plugin-sdk.git (fetch)
your_user_name  https://github.com/your_user_name/dynamic-plugin-sdk.git (push)
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
