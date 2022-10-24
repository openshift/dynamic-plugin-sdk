#!/bin/bash
set -euo pipefail

yarn install
yarn build-libs

mkdir -p docs/generated && rm -rf docs/generated/*

shopt -s globstar
cp packages/lib-*/dist/api/lib-*.api.json docs/generated

yarn api-documenter markdown -i docs/generated -o docs/generated/api
