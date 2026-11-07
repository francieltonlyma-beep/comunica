import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'functions/lib/**', 'src/dataconnect-generated/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['comunica/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['public/firebase-messaging-sw.js'],
    languageOptions: {
      globals: { ...globals.serviceworker, firebase: 'readonly' },
    },
  },
  {
    files: ['src/App.jsx'],
    languageOptions: { globals: { __initial_auth_token: 'readonly' } },
    // This legacy screen resets related state in effects throughout the module.
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
])
