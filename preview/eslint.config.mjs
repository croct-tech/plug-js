import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { configs } from '@croct/eslint-plugin';

export default defineConfig(
    configs.typescript,
    {
        ignores: [
            'build/**',
            'node_modules/**',
        ],
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            }
        }
    }
);