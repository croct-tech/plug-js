import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
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

    if (args['config-preview-widget-origin'] === undefined) {
        throw new Error('The argument "config-preview-widget-origin" is missing.');
    }

    if (args['config-preview-widget-url'] === undefined) {
        throw new Error('The argument "config-preview-widget-url" is missing.');
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
                typescript({module: 'esnext'}),
                replace({
                    preventAssignment: true,
                    delimiters: ['<@', '@>'],
                    cdnUrl: args['config-cdn-url'],
                    playgroundOrigin: args['config-playground-origin'],
                    playgroundConnectUrl: args['config-playground-connect-url'],
                    previewWidgetOrigin: args['config-preview-widget-origin'],
                    previewWidgetUrl: args['config-preview-widget-url'],
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
