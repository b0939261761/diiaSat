module.exports = {
  root: true,
  env: {
    node: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  extends: ['airbnb-base', 'plugin:node/recommended'],
  rules: {
    'comma-dangle': ['error', 'never'],
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],

    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['prev']
    }]
  }
};
