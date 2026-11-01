/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Partes del monorepo; deja usar otros scopes, pero avisa
    'scope-enum': [1, 'always', ['server', 'client', 'docs', 'deps', 'repo']],
    'header-max-length': [2, 'always', 100],
  },
};
