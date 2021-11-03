#!/bin/bash
set -exuo pipefail

# TODO remove once build script gets called before test script
yarn install

# TODO lint
yarn test
