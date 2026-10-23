module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  transformIgnorePatterns: [String.raw`/node_modules/(?![@polymeshassociation/src]).+\.js$`],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/dist/*'],
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
  testRegex: String.raw`.*\.spec\.ts$`,
  coverageDirectory: './coverage',
  collectCoverage: true,
  restoreMocks: true,
};
