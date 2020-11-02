import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import {terser} from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default args => {
    if (args['config-cdn-url'] === undefined) {
        throw new Error('The argument "config-cdn-url" is missing.');
    }

    if (args['config-playground-origin'] === undefined) {
        throw new Error('The argument "config-playground-origin" is missing.');
    }

    if (args['config-playground-connect-url'] === undefined) {
        throw new Error('The argument "config-playground-connect-url" is missing.');
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
                    playgroundOrigin: args['config-playground-origin'],
                    playgroundConnectUrl: args['config-playground-connect-url'],

                }),
                terser({
                    format: {
                        comments: false,
                    },
                }),
            ],
        },
    ];
};
