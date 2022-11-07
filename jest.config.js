module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/test/**/*.test.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!@croct/.*)',
    ],
};
