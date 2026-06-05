#!/usr/bin/env bash
set -exuo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
RESULTS_DIR=packages/sample-app/integration-tests/results

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$RESULTS_DIR" ]; then
    echo "Copying artifacts from $(pwd)..."
    cp -r "$RESULTS_DIR" "${ARTIFACT_DIR}/e2e_test_results"
  fi
}

trap copyArtifacts EXIT

yarn install
yarn build-libs
yarn build-samples

# Run Playwright E2E tests (webServer config starts http-server automatically)
yarn test-e2e
