#!/bin/bash
# Rebuild js/dist/scene.js (three.js + all 3D scenes in one file). Run: bash tools/build.sh
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm i
mkdir -p tex
for f in biohazard-label itec-logo iso-badges trend-logo trend-e; do sips -Z 512 -s format jpeg -s formatOptions 82 "../assets/$f.png" --out "tex/$f.jpg" >/dev/null; done
node gen-tex.mjs
NODE_PATH="$PWD/node_modules" npx esbuild ../js/src/main.js --bundle --minify --format=iife --target=es2019 --outfile=../js/dist/scene.js
