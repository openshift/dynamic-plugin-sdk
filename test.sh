#!/bin/bash
set -exuo pipefail

# TODO remove this once CI runs build script prior to test script
./build.sh

yarn lint
yarn test
