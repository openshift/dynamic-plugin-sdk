#!/bin/bash
set -exuo pipefail

print_error() { printf "%s\n" "$*" >&2; }

JOB_TYPE=${JOB_TYPE:-"local"}

# Install dependencies
yarn install

# Check for outdated yarn.lock file
if [[ -n "$(git status --porcelain -- yarn.lock)" ]]; then
  print_error "Outdated yarn.lock file, commit changes to fix"
  print_error "$(git diff --stat -- yarn.lock)"
  exit 1
fi

# Build packages
yarn build

# Analyze code for potential problems
yarn lint

# Run unit tests
yarn test

# Run end-to-end tests
# TODO

# Upload code coverage
if [[ "${JOB_TYPE}" == "presubmit" ]]; then
  echo "detected PR code coverage job for #${PULL_NUMBER}"
  REF_FLAGS="-P ${PULL_NUMBER} -C ${PULL_PULL_SHA}"
elif [[ "${JOB_TYPE}" == "postsubmit" || "${JOB_TYPE}" == "periodic" ]]; then
  REF_FLAGS=""
else
  echo "Coverage not enabled on Job Type :${JOB_TYPE}"
fi

if [[ "${JOB_TYPE}" != "local" ]]; then
  curl -Os https://uploader.codecov.io/latest/linux/codecov
  chmod +x codecov
  ./codecov -t ${CODECOV_TOKEN} -r "openshift/dynamic-plugin-sdk" ${REF_FLAGS} --dir ./coverage
fi

exit 1;
