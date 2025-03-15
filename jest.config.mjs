/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    testEnvironment: 'jsdom',
    preset: 'ts-jest/presets/js-with-babel',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!@croct/(sdk|content))',
    ],
};
