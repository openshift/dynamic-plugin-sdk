# Developer Setup

## Prerequisites

- [Node.js](https://nodejs.org/) version used by
  [ci-operator-buildroot](../docker/Dockerfile.ci-operator-buildroot) image
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

## Lint and test specific file paths

```sh
yarn eslint path/to/lint
yarn jest path/to/test
```
