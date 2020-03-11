import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import {uglify} from 'rollup-plugin-uglify';
import dts from 'rollup-plugin-dts';

export default () => {
    const minify = process.env.minify || false;

    return [
        {
            input: 'src/index.ts',
            output: {
                file: minify ? 'build/index.min.js' : 'build/index.js',
                name: 'croct',
                format: 'iife',
                sourcemap: true,
            },
            treeshake: {
                propertyReadSideEffects: false
            },
            plugins: [
                resolve(),
                typescript({
                    cacheRoot: `${tempDir}/.rpt2_cache`,
                    useTsconfigDeclarationDir: true
                }),
                minify ?
                    uglify({
                        compress: {
                            unused: true,
                            dead_code: true,
                        }
                    }) : {},
            ]
        },
        {
            input: './build/declarations/index.d.ts',
            output: [{file: 'build/index.d.ts', format: 'es'}],
            plugins: [dts({respectExternal: true})],
        },
    ];
};