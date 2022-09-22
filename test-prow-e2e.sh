#!/usr/bin/env bash
set -exuo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
SCREENSHOTS_DIR=screenshots

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

# Start servers for sample app and sample plugin, run E2E tests and shut down the servers
yarn test-e2e-ci
