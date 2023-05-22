#!/bin/bash

rm -rf output
npx tsc
cat output/*.d.ts > ./lib/index.d.ts