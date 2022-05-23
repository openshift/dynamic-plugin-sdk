#!/bin/bash
set -euo pipefail

LABEL_PUBLISH="publish-sdk"
PACKAGE_GLOB=(./packages/lib-*)
NPM_REGISTRY="https://registry.npmjs.org/"
NPM_REGISTRY_AUTH_KEY="//registry.npmjs.org/:_authToken"
LABELS=$(curl -s \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PULL_NUMBER}" \
  | jq '.labels | map(.name)')
HAS_PUBLISH=$(printf '%s\n' "${LABELS}" | jq 'index("'${LABEL_PUBLISH}'")')

if [[ "${HAS_PUBLISH}" != "null" ]]; then
  echo 'publish NPM packages'
  if [[ "${JOB_TYPE}" != "postsubmit" ]]; then
    echo 'non postsubmit job detected - performing dry run'
    DRY_RUN="--dry-run"
  else
    DRY_RUN=""
  fi
  npm set registry $NPM_REGISTRY
  npm set $NPM_REGISTRY_AUTH_KEY $NPM_TOKEN

  for package in "${PACKAGE_GLOB[@]}"; do
    cd "$package"
    PACKAGE_NAME=$(jq -r .name < ./package.json)
    NPM_VERSION=$(npm view $PACKAGE_NAME dist-tags.latest)
    echo "$PACKAGE_NAME NPM_VERSION: $NPM_VERSION"
    GIT_VERSION=$(jq -r .version < ./package.json)
    echo "$PACKAGE_NAME GIT_VERSION: $GIT_VERSION"
    if [[ "${NPM_VERSION}" == "${GIT_VERSION}" ]]; then
      echo 'NPM version and GIT version identical - nothing to do'
    else
      echo "publishing ${PACKAGE_NAME} version ${GIT_VERSION}"
      npm publish --no-git-tag-version "$DRY_RUN"
    fi
    cd ../../
  done
else
  echo "skipping publish NPM packages - missing Github label"
fi
