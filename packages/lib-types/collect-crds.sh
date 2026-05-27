#!/usr/bin/env sh

set -euo pipefail

OPENSHIFT_API_COMMIT=$(jq -r '.["openshift/api"]' sources.json)

OPENSHIFT_API_URL="https://github.com/openshift/api/archive/${OPENSHIFT_API_COMMIT}.tar.gz"
CACHE_DIR="./cached"
ARCHIVE="$CACHE_DIR/openshift-api.tar.gz"
EXTRACT_DIR="$CACHE_DIR/openshift-api"

mkdir -p "$CACHE_DIR"

if [ ! -d "$EXTRACT_DIR" ]; then
  curl --fail --silent --location -o "$ARCHIVE" "$OPENSHIFT_API_URL"
  mkdir -p "$EXTRACT_DIR"
  tar -xzf "$ARCHIVE" -C "$EXTRACT_DIR" --strip-components=1
  rm "$ARCHIVE"
fi

mkdir -p "$CACHE_DIR/openshift-crds"
rm -rf "$CACHE_DIR/openshift-crds"/*
cd "$CACHE_DIR/openshift-crds"
find ../openshift-api -type f -name "*.crd.yaml" -exec ln -sf {} ./ \;
