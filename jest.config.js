/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    testEnvironment: 'jsdom',
    preset: 'ts-jest/presets/js-with-babel',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!@croct/content/)',
    ],
};
