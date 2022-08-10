/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset                     : 'ts-jest',
  testEnvironment            : 'node',
  collectCoverage            : true,
  collectCoverageFrom        : ['src/**/*.ts'],
  coveragePathIgnorePatterns : ['src/index.ts'],
  coverageThreshold          : {
    global: {
      branches   : 80,
      functions  : 80,
      lines      : 80,
      statements : -10,
    },
  },
  moduleNameMapper: { '^@src/(.*)$': '<rootDir>/src/$1' },
}
