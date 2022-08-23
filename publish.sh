#!/bin/bash
set -euo pipefail

# https://github.com/kubernetes/test-infra/blob/master/prow/jobs.md#job-environment-variables
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
LABELS=$(if [ $PULL_NUMBER != 0 ]; then curl -s \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PULL_NUMBER}" \
  | jq '.labels? | map(.name)?'; else echo "null"; fi)
HAS_PUBLISH=$(jq 'index("'${LABEL_PUBLISH}'")' <<< ${LABELS})
PUBLISH_ARGS="--no-git-tag-version"

if [[ ( "${JOB_TYPE}" != "local" && "${HAS_PUBLISH}" != "null" ) || "${FORCE_PUBLISH}" == "true" ]]; then
  echo 'publish npm packages'

  if [[ "${JOB_TYPE}" != "postsubmit" && "${FORCE_PUBLISH}" != "true" ]]; then
    echo 'non postsubmit job detected - performing dry run'
    PUBLISH_ARGS="${PUBLISH_ARGS} --dry-run"
  fi

  npm set registry $NPM_REGISTRY
  if [[ "${NPM_TOKEN}" != "notoken" ]]; then
    npm set $NPM_REGISTRY_AUTH_KEY $NPM_TOKEN
  else
    echo 'no npm registry token to be set'
  fi

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
      npm publish "$PUBLISH_ARGS"
    fi
    popd > /dev/null
  done
else
  echo "skipping publish of npm packages"
fi
