#!/bin/bash

########################################################################
########################################################################

# sort the JSON keys of all the locales

########################################################################
########################################################################

## https://stedolan.github.io/jq/manual/
JQ_PARAM="def recsort: if type==\"array\" then [.[]|recsort]|sort elif type==\"object\" then (.[]) |= recsort else . end; recsort"
echo "${JQ_PARAM}"

#for relativefilepath in packages/**/locales/*.json; do
find ./src -maxdepth 100 -type f -name "*.json" -regex "\./src/resources/locales/[^/]*\.json" -print0 | while IFS= read -rd '' relativefilepath; do
    filename=`basename "${relativefilepath}"`
    echo "${relativefilepath} ===> ${filename}"

    #jq -S "${JQ_PARAM}" --indent 4 "${relativefilepath}"
    jq -S "${JQ_PARAM}" --indent 4 "${relativefilepath}" > "${relativefilepath}.tmp" && mv "${relativefilepath}.tmp" "${relativefilepath}"
    git --no-pager diff "${relativefilepath}"
done
# < <(FIND_COMMAND_HERE)

git status
