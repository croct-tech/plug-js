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
        rules: {
            'import/no-default-export': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'off',
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            }
        }
    }
);
