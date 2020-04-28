import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import dts from 'rollup-plugin-dts';
import commonjs from 'rollup-plugin-commonjs';

export default () => {
    return [
        {
            input: 'src/index.ts',
            output: {
                file: 'build/index.js',
                format: 'commonjs',
                exports: 'named',
                sourcemap: true,
            },
            plugins: [
                resolve(),
                commonjs(),
                typescript({
                    cacheRoot: `${tempDir}/.rpt2_cache`,
                    useTsconfigDeclarationDir: true,
                }),
            ],
        },
        {
            input: './build/declarations/index.d.ts',
            output: [{file: 'build/index.d.ts', format: 'commonjs'}],
            plugins: [dts({respectExternal: true})],
        },
    ];
};
