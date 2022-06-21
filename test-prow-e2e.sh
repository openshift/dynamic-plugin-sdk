#!/usr/bin/env bash

set -exuo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
SCREENSHOTS_DIR=packages/e2e-sample-app/screenshots

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$SCREENSHOTS_DIR" ]; then
    echo "Copying artifacts from $(pwd)..."
    cp -r "$SCREENSHOTS_DIR" "${ARTIFACT_DIR}/e2e_test_screenshots"
  fi
}

trap copyArtifacts EXIT

yarn install
yarn build-libs
yarn build-samples

# Disable color codes in Cypress since they do not render well CI test logs.
# https://docs.cypress.io/guides/guides/continuous-integration.html#Colors
export NO_COLOR=1

# Start servers for sample app and plugin on ports 9000 and 9001 respectively, run E2E tests and shut down the servers
yarn test-e2e-ci
