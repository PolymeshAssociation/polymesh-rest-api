module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  transformIgnorePatterns: ['/node_modules/(?![@polymathnetwork/src]).+\\.js$'],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.spec.(ts|tsx)'],
  testPathIgnorePatterns: ['dist'],
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
};
