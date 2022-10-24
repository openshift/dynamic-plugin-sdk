#!/bin/bash
set -exuo pipefail

# Setup environment
export NODE_OPTIONS="--max-old-space-size=4096"

# Print system information
echo "node $(node -v)"
echo "npm $(npm -v)"
echo "yarn $(yarn -v)"

# Install dependencies
yarn install --immutable

# Build packages
yarn build

# Analyze code for potential problems
yarn lint

# Run unit tests
yarn test

# Ensure that Git repo is still clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Git repository is not clean, make sure that all changes are committed"
  exit 1
fi

# Upload code coverage
./prow-codecov.sh 2>/dev/null
