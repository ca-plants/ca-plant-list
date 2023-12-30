#!/bin/bash

rm -rf output
npx tsc --skipLibCheck
cat output/*.d.ts > ./lib/index.d.ts