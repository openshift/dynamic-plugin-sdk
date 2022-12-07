#!/bin/bash
set -euo pipefail

for dir in node_modules dist; do
  find . -type d -name "$dir" -prune -exec rm -rf {} \;
done
