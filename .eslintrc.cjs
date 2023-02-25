module.exports = {
  extends: ['@amnis/eslint-config-node'],
  rules: {
    'import/no-unresolved': 'off',
    'import/no-cycle': [
      'error',
      {
        maxDepth: 10,
        ignoreExternal: true,
      },
    ],
  },
};
