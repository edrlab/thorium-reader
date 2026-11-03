# Scripts

## csvToJson.py

Used to transform a csv file contaning iso languages in json.

It takes 4 parameters (keep in that order):

- the path of the source csv file to parse

- the path of the target json file

- the index of the column for the language name (french or english for exemple)

- the index of column for the iso code of the language

## Localization scanner

Run `npm run test:i18n-scan` to check translation-key extraction. The scanner recognizes direct translation calls, literal keys passed as the second argument to `withErrorNotification`, and dynamic template keys already present in the English catalog.

After changing translation usage, run `npm run i18n-scan`, `npm run i18n-check`, and `npm run i18n-typed` to update the reference catalog, synchronize other locales, sort the catalogs, and regenerate types. Missing translations remain empty for translators.
