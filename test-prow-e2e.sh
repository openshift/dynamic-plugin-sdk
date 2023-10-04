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

# Create a virtual X11 display via Xvfb for use with Cypress E2E testing
Xvfb :99 -screen 0 1920x1080x24 2>&1 > /dev/null &
export DISPLAY=':99.0'

export CYPRESS_CRASH_REPORTS=0
export CYPRESS_COMMERCIAL_RECOMMENDATIONS=0

# Start servers for sample app and sample plugin and run Cypress E2E tests
yarn test-e2e

# Kill the Xvfb background process
pkill Xvfb
