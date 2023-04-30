#!/bin/bash

rm -rf output
npx tsc
cat output/* > ./lib/index.d.ts