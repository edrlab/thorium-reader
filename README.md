# Readium Desktop

## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/edrlab/readium-desktop.svg?branch=master)](https://travis-ci.org/edrlab/readium-desktop)

## Prerequisites

1) https://nodejs.org NodeJS >= 6, NPM >= 3 (check with `node --version` and `npm --version` from the command line)
2) https://yarnpkg.com Yarn >= 0.21 (check with `yarn --version` from the command line)

## Quick start

In readium-desktop project

### Install readium-desktop dependencies

1) `npm install` (initialize local `node_modules` packages from dependencies declared in `package.json`)

### Start application in dev environment

1) `npm run start:dev`

### Start application in production environment

1) `npm start`

## Useful commands

### Upgrade global packages

1) `npm update --global` (sync NPM global packages)

### Upgrade readium desktop packages

1) `npm update` (sync local packages)

After each upgrade do not forget to reinstall pouchdb:

2) `yarn pouchdb:install`

### Lint

It's very important (required) to launch lint before pushing any code on github repository

1) `npm run lint`

## Technologies

* typescript
* electron
* reactjs
* redux
* saga
* i18next

## Getting started

### Production

```
npm start
```

### Development

```
npm run start:dev
```

This environment provides a hot loader.
So if you made changes in your code, electron will automatically reload
your app.
