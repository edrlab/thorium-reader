# Readium Desktop

## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/edrlab/readium-desktop.svg?branch=master)](https://travis-ci.org/edrlab/readium-desktop)

## Prerequisites

1) https://nodejs.org NodeJS >= 6, NPM >= 3 (check with `node --version` and `npm --version` from the command line)
2) https://yarnpkg.com Yarn >= 0.21 (check with `yarn --version` from the command line)

## Quick start

Command line steps:

1) `cd readium-desktop`
2) `npm update --global` (sync NPM global packages)
3) `yarn global upgrade` (sync Yarn global packages)
4) `yarn install` (initialize local `node_modules` packages from dependencies declared in `package.json`)
5) `yarn upgrade` (sync local packages)
6) `yarn run lint` (code linting)
7) `yarn start` (runs the app)
8) `yarn start:dev` (runs the app in dev mode)

## Technologies

* typescript
* electron
* reactjs
* redux
* i18next

## Install

Install all dependencies

```
yarn install
```

## Getting started

### Production

```
yarn start
```

### Development

```
yarn run start:dev
```

This environment provides a hot loader.
So if you made changes in your code, electron will automatically reload
your app.
