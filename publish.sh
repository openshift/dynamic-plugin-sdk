#!/bin/bash
set -euo pipefail

JOB_TYPE=${JOB_TYPE:-local}
REPO_OWNER=${REPO_OWNER:-openshift}
REPO_NAME=${REPO_NAME:-dynamic-plugin-sdk}
PULL_NUMBER=${PULL_NUMBER:-0}
NPM_TOKEN=${NPM_TOKEN:-notoken}
FORCE_PUBLISH=${FORCE_PUBLISH:-false}

LABEL_PUBLISH="publish-sdk"
PACKAGE_GLOB=(./packages/lib-*)
NPM_REGISTRY="https://registry.npmjs.org/"
NPM_REGISTRY_AUTH_KEY="//registry.npmjs.org/:_authToken"
LABELS=$(curl -s \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PULL_NUMBER}" \
  | jq '.labels? | map(.name)?')
HAS_PUBLISH=$(printf '%s\n' "${LABELS}" | jq 'index("'${LABEL_PUBLISH}'")')

if [[ ( "${JOB_TYPE}" != "local" && "${HAS_PUBLISH}" != "null" ) || "${FORCE_PUBLISH}" == "true" ]]; then
  echo 'publish npm packages'
  if [[ "${JOB_TYPE}" != "postsubmit" && "${FORCE_PUBLISH}" != "true" ]]; then
    echo 'non postsubmit job detected - performing dry run'
    DRY_RUN="--dry-run"
  else
    DRY_RUN=""
  fi
  npm set registry $NPM_REGISTRY
  npm set $NPM_REGISTRY_AUTH_KEY $NPM_TOKEN

  for package in "${PACKAGE_GLOB[@]}"; do
    pushd "$package" > /dev/null
    PACKAGE_NAME=$(jq -r .name < ./package.json)
    NPM_VERSION=$(npm view $PACKAGE_NAME dist-tags.latest)
    echo "$PACKAGE_NAME NPM_VERSION: $NPM_VERSION"
    GIT_VERSION=$(jq -r .version < ./package.json)
    echo "$PACKAGE_NAME GIT_VERSION: $GIT_VERSION"
    if [[ "${NPM_VERSION}" == "${GIT_VERSION}" ]]; then
      echo 'npm version and git version identical - nothing to do'
    else
      echo "publishing ${PACKAGE_NAME} version ${GIT_VERSION}"
      npm publish --no-git-tag-version "$DRY_RUN"
    fi
    popd > /dev/null
  done
else
  echo "skipping publish npm packages"
fi
