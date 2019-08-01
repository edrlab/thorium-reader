#!/bin/bash

echo "\"en\":{\"translation\":{`cat src/resources/locales/en.json`}}" > src/resources/locales/en.tmp.json &&
typed_i18n -i src/resources/locales/en.json -o src/typings -l typescript &&
rm -f src/resources/locales/en.tmp.json