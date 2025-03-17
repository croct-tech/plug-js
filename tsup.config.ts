import {defineConfig} from 'tsup';
import {fixImportsPlugin} from 'esbuild-fix-imports-plugin';

export default defineConfig({
    esbuildPlugins: [fixImportsPlugin()],
    entry: ['src/**/*.ts'],
    dts: true,
    clean: true,
    sourcemap: false,
    outDir: 'build',
    splitting: false,
    bundle: false,
    format: ['cjs', 'esm'],
});
