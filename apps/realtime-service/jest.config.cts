module.exports = {
  displayName: 'realtime-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  passWithNoTests: true,
  coverageDirectory: '../../coverage/apps/realtime-service'
};
