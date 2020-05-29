import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import {uglify} from 'rollup-plugin-uglify';
import commonjs from '@rollup/plugin-commonjs';

export default args => {
    if (args['config-cdn-url'] === undefined) {
        throw new Error('The argument "config-cdn-url" is missing.');
    }

    return [
        {
            input: 'src/index.ts',
            output: {
                file: 'build/plug.min.js',
                name: 'croct',
                format: 'iife',
            },
            context: 'this',
            treeshake: {
                propertyReadSideEffects: false,
            },
            plugins: [
                resolve(),
                commonjs(),
                typescript({
                    cacheRoot: `${tempDir}/.rpt2_cache`,
                }),
                replace({
                    delimiters: ['<@', '@>'],
                    cdnUrl: args['config-cdn-url'],

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
