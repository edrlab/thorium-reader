#!/bin/sh

# npm install --save-dev --foreground-scripts npm-scripts-lifecycle
# npm install --foreground-scripts

# --ignore-scripts
# npm config set ignore-scripts true
# .npmrc ===> ignore-scripts=true

# https://docs.npmjs.com/cli/v10/using-npm/scripts

# npm query ':attr(scripts, [preinstall]), :attr(scripts, [install]), :attr(scripts, [postinstall]), :attr(scripts, [prepublish]), :attr(scripts, [preprepare]), :attr(scripts, [prepare]), :attr(scripts, [postprepare])' | jq -c '.[] | {name, preinstall: .scripts.preinstall?, install: .scripts.install?, postinstall: .scripts.postinstall?, prepublish: .scripts.prepublish?, preprepare: .scripts.preprepare?, prepare: .scripts.prepare?, postprepare: .scripts.postprepare?}' | tr '\n' '\0' | xargs -0 -n1 -J % echo % | jq -r '. | "######################## [\(.name)]€€--preinstall: \(.preinstall?)€€--install: \(.install?)€€--postinstall: \(.postinstall?)€€--prepublish: \(.prepublish?)€€--preprepare: \(.preprepare?)€€--prepare: \(.prepare?)€€--postprepare: \(.postprepare?)€€"' | sed -e 's/€/\n/g' -e 's/ null//g'

npm query ':attr(scripts, [preinstall]), :attr(scripts, [install]), :attr(scripts, [postinstall])' | jq -c '.[] | {name, preinstall: .scripts.preinstall?, install: .scripts.install?, postinstall: .scripts.postinstall?}' | tr '\n' '\0' | xargs -0 -n1 -J % echo % | jq -r '. | "######################## [\(.name)]€€--preinstall: \(.preinstall?)€€--install: \(.install?)€€--postinstall: \(.postinstall?)€€"' | sed -e 's/€/\n/g' -e 's/ null//g'

# -e 's/^"//' -e 's/"$//'
#| sed -E -e 's/{//' -e 's/}//' -e 's/[ ]*"name":[[:blank:]]"(.+)",/---\1---/g'
# for i in `npm query ':attr(scripts, [postinstall])' | jq -c '.[] | {name, postinstall: .scripts.postinstall}' | tr '[:blank:]' '€'`; do echo "${i}" | tr '€' ' '; done;
#
# echo '######'
#  | tr ' ' '\0'
#  | tr '\n' '\0' | xargs -0 -n1 -I '{}' echo '[{}]'
# | xargs -n1 -I '{}' echo '{}'
# echo ${JSON_NPM_POSTINSTALL} | jq '.[].name' | sed -e 's/^"//' -e 's/"$//' | tr '\n' '\0' | xargs -0 -n1 -I '{}' echo '[{}]'
# echo ${JSON_NPM_POSTINSTALL} | jq '.[].scripts.postinstall'
# jq 'map(.name)'
# jq 'map(.scripts.postinstall)'
