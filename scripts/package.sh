#!/usr/bin/env bash
# package dashboard as one rpm

set -ex

npm install
npm run build
npm run tsc
tar -czf node_modules.tar.gz node_modules/
mkdir tmp
cmake . -B ./tmp
cd ./tmp
cpack -G RPM
ls -a