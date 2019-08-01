#!/bin/bash

echo "{\"en\":{\"translation\":`cat src/resources/locales/en.json`}}" > /tmp/en.json && \
./node_modules/@kogai/typed_i18n/index.js -i /tmp/en.json -o src/typings -l typescript && \
rm -f /tmp/en.json