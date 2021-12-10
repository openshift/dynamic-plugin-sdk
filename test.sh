#!/bin/bash
set -euo pipefail

print_error() { printf "%s\n" "$*" >&2; }

# Install dependencies
yarn install

# Check for outdated yarn.lock file
if [[ -n "$(git status --porcelain -- yarn.lock)" ]]; then
  print_error "Outdated yarn.lock file, commit changes to fix"
  print_error "$(git diff --stat -- yarn.lock)"
  exit 1
fi

# Analyze code for potential problems
yarn lint

# Run unit tests
yarn test

# Build packages
yarn build

# Run end-to-end tests
# TODO
