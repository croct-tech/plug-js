/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
