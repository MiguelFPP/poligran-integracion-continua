// Reportes JUnit para Jenkins: `reports/junit.xml` dentro de apps/api.
// `CI=true` los emite; en local no se escribe nada.
const ciReporters = process.env.CI === 'true'
  ? ['default', ['jest-junit', { outputDirectory: 'reports', outputName: 'junit.xml' }]]
  : undefined;

export default {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '.*\\.e2e-spec\\.ts$'],
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
  coverageDirectory: 'coverage/unit',
  coverageReporters: process.env.CI === 'true' ? ['text', 'lcov', 'html'] : ['text', 'lcov'],
  coverageThreshold: {
    global: { statements: 70, lines: 70, branches: 60 },
  },
  clearMocks: true,
};
