module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/**/*.test.ts'],
    verbose: true,
    forceExit: true,
    setupFiles: ['<rootDir>/src/tests/jest-env-setup.ts'],
    globalSetup: '<rootDir>/src/tests/global-setup.ts',
    globalTeardown: '<rootDir>/src/tests/global-teardown.ts',
    detectOpenHandles: true,
    // clearMocks: true,
};