#!/usr/bin/env bash
# Copies the shared breathing page into docs/ (served by GitHub Pages for the iPhone).
set -euo pipefail
cd "$(dirname "$0")/.."
cp extension/breathe.css extension/breathe.js docs/
cp extension/breathe.html docs/index.html
cp extension/icons/128.png docs/apple-touch-icon.png
