---
name: localize
description: "Application localization / internationalization"
---

# Translations

- The `i18next` library is used to handle translated strings.
- Translated application labels / messages are stored in individual JSON files, one per supported locale: `./src/resources/locales/*.json`.
- The JSON format is hierachical (i.e. nested keys, not flattened).
- Some keys are plurals (zero, one, many, others, etc.), which vary depending on languages.
- String values optionally contain interpolated named variables denoted by curly braces (e.g. `This is my {{ name }}.`). This is checked during compilation (missing or incorrectly-named arguments in the translation function).
- After adding/removing translated labels in the application, execute the command `npm run i18n-json` to automatically discover used translation keys in the codebase and adjust the JSON files accordingly. This normalises the JSON syntax, i.e. all keys must be present in all supported languages (even if values are missing for some locales), and alphabetical ordering + consistent indentation. Then also execute `npm run i18n-typed` which ensures that TypeScript typings are up-to-date for the next type-checking command.
- In the TypeScript / TSX code, dynamically-constructed keys cannot be discovered so use explicitly-quoted translation keys (e.g. `__("key.subkey")` or `translate("key.subkey")`, or with function arguments for interpolated strings for example `__("key.subkey", { name })`).
