module.exports = {
  testEnvironment: 'node',
  verbose: true,
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/src'
  ],
  // The testMatch patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$'
  ],
  // Setup files after env
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if you have a setup file
};
