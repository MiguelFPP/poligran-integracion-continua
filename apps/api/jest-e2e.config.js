// Reportes JUnit para Jenkins: `reports/junit-e2e.xml` dentro de apps/api.
// `CI=true` los emite; en local no se escribe nada.
const ciReporters = process.env.CI === 'true'
  ? ['default', ['jest-junit', { outputDirectory: 'reports', outputName: 'junit-e2e.xml' }]]
  : undefined;

export default {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  ...(ciReporters ? { reporters: ciReporters } : {}),
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { useESM: true, tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/generated/**',
    '!src/main.ts',
    '!src/app.module.ts',
    '!src/app.setup.ts',
    '!src/**/*.module.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage/e2e',
  testTimeout: 30000,
  maxWorkers: 1,
};
