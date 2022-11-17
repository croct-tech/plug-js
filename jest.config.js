module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!@croct/.*)',
    ],
};
