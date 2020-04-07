import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import {uglify} from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';

export default () => {
    return [
        {
            input: 'src/plug.ts',
            output: {
                file: 'build/plug.min.js',
                name: 'croct',
                format: 'iife',
                sourcemap: false,
            },
            treeshake: {
                propertyReadSideEffects: false,
            },
            plugins: [
                resolve(),
                commonjs(),
                typescript({
                    cacheRoot: `${tempDir}/.rpt2_cache`,
                    useTsconfigDeclarationDir: true,
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
