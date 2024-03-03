#!/bin/bash

rm -rf output
rm lib/index.d.ts
npx tsc
npx dts-bundle-generator -o lib/index.d.ts output/lib/index.d.ts