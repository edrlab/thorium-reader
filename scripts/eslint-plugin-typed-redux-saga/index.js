'use strict';

// https://github.com/jambit/eslint-plugin-typed-redux-saga

module.exports = {
    rules: {
        'use-typed-effects': require('./rules/use-typed-effects'),
        'delegate-effects': require('./rules/delegate-effects'),
    },
};
