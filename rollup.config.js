import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import {uglify} from 'rollup-plugin-uglify';
import commonjs from '@rollup/plugin-commonjs';

export default (args) => {
    if (args['config-cdn-prefix'] === undefined) {
        throw new Error('The argument "config-cdn-prefix" is missing.');
    }

    if (args['config-cdn-suffix'] === undefined) {
        throw new Error('The argument "config-cdn-suffix" is missing.');
    }

    return [
        {
            input: 'src/index.ts',
            output: {
                file: 'build/plug.min.js',
                name: 'croct',
                format: 'iife',
            },
            treeshake: {
                propertyReadSideEffects: false,
            },
            plugins: [
                resolve(),
                commonjs(),
                typescript({
                    cacheRoot: `${tempDir}/.rpt2_cache`,
                    tsconfigOverride: {
                        compilerOptions: {
                            module: "ES2015"
                        }
                    },
                }),
                replace({
                    delimiters: ['<@', '@>'],
                    'cdn-prefix': args['config-cdn-prefix'],
                    'cdn-suffix': args['config-cdn-suffix'],

                }),
                uglify({
                    compress: {
                        unused: true,
                        dead_code: true,
                    },
                }),
            ],
        },
    ];
};
