// Workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    plugins: [
        '@croct',
    ],
    extends: [
        'plugin:@croct/typescript',
    ],
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    env: {
        browser: true,
    },
};
