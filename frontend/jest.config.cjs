module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom', // Use jsdom for browser-like environment
  moduleNameMapper: {
    // If you have module aliases in tsconfig.json, map them here
    // Example: '^@components/(.*)$': '<rootDir>/src/components/$1'

    // Mock static assets if you import them in components
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'], // if you use jest-dom matchers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Path to your tsconfig.json
    }],
    '^.+\\.(js|jsx)$': 'babel-jest', // Keep babel-jest for JS files if any
  },
  // Ignore transform for node_modules except for specific modules if needed
  transformIgnorePatterns: [
    '/node_modules/(?!some-es-module-to-transform)/'
  ],
};
