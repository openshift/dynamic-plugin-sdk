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

# Upload code coverage
./prow-codecov.sh 2>/dev/null
