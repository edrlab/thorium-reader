'use strict';

const MESSAGE = 'You should use typed-redux-saga effects';

module.exports = {
    meta: {
        type: 'suggestion',

        docs: {
            description: 'Use typed-redux-saga for effects',
            category: 'Best Practices',
            recommended: true,
            url: 'https://github.com/jambit/eslint-plugin-typed-redux-saga/',
        },
        fixable: 'code',
        schema: [], // no options
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (node.source.value === 'redux-saga/effects') {
                    context.report({
                        node,
                        message: MESSAGE,
                        fix(fixer) {
                            const sourceCode = context.getSourceCode();
                            const fixed = sourceCode
                                .getText(node)
                                .replace('redux-saga/effects', 'typed-redux-saga/macro');
                            return fixer.replaceText(node, fixed);
                        },
                    });
                }
            },
        };
    },
};
