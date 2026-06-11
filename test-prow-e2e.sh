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

# Test cross compatibility of rspack/webpack
SCENARIOS=(
  "build-rspack build-rspack"
  "build-prod   build-rspack"
  "build-rspack build-prod"
  "build-prod   build-prod"
)

for scenario in "${SCENARIOS[@]}"; do
  read -r app_script plugin_script <<< "$scenario"
  echo "Testing sample-app ($app_script) + sample-plugin ($plugin_script)"
  yarn workspace @monorepo/sample-app run "$app_script"
  yarn workspace @monorepo/sample-plugin run "$plugin_script"
  yarn test-e2e
done
