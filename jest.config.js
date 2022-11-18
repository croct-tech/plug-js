/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
};
