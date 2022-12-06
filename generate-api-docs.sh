#!/bin/bash
set -euo pipefail

yarn install
yarn build-libs

mkdir -p docs/generated && rm -rf docs/generated/*

for dir in packages/lib-*; do
  cp $dir/dist/api/$(basename $dir).api.json docs/generated
done

yarn api-documenter markdown -i docs/generated -o docs/generated/api
