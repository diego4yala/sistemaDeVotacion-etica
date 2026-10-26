/** Tests unitarios (motor de requisitos, servicios). No requieren base de datos. */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { isolatedModules: true }] },
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts', '!**/*.module.ts', '!main.ts'],
};
