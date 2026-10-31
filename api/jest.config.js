/** Testes da API: integração com o Postgres de teste (blog_citi_teste). Rode com `npm run test`. */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: 'test/.*\.spec\.ts$',
  transform: { '^.+\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', esModuleInterop: true, experimentalDecorators: true, emitDecoratorMetadata: true, target: 'ES2022', strict: true, skipLibCheck: true, types: ['node', 'jest'] }, diagnostics: true }] },
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  testTimeout: 20000,
  // Os testes compartilham o mesmo banco: rodam um arquivo por vez.
  maxWorkers: 1,
}
