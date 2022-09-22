#!/bin/bash
set -exuo pipefail

print_error() { printf "%s\n" "$*" >&2; }

# Print system information
echo "node $(node -v)"
echo "npm $(npm -v)"
echo "yarn $(yarn -v)"

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
./prow-codecov.sh 2>/dev/null
