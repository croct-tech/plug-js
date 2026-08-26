#!/usr/bin/env node
import {pathToFileURL} from 'url';

const CDN_ORIGIN = 'https://cdn.croct.io';
const PLAYGROUND_ORIGIN = 'https://play.croct.com';

/**
 * The environment variable that exposes each constant to the workflows.
 */
const VARIABLES = {
    cdnUrl: 'CDN_URL',
    playgroundOrigin: 'PLAYGROUND_ORIGIN',
    playgroundConnectUrl: 'PLAYGROUND_CONNECT_URL',
    previewWidgetOrigin: 'PREVIEW_WIDGET_ORIGIN',
    previewWidgetUrl: 'PREVIEW_WIDGET_URL',
};

export function getVersion() {
    const version = process.argv[2] ?? process.env.GITHUB_REF_NAME;

    if (version === undefined || version === '') {
        throw new Error('The version is missing. Pass it as an argument or set GITHUB_REF_NAME.');
    }

    return version;
}

export function getWidgetPath(version) {
    return `js/v1/lib/plug/widget-${version}.html`;
}

/**
 * Resolves the values for the `<@placeholder@>` markers declared in `src/constants.ts`.
 */
export function getConstants(version) {
    return {
        cdnUrl: `${CDN_ORIGIN}/js/v1/lib/plug.js`,
        playgroundOrigin: PLAYGROUND_ORIGIN,
        playgroundConnectUrl: `${PLAYGROUND_ORIGIN}/connect.html`,
        previewWidgetOrigin: CDN_ORIGIN,
        previewWidgetUrl: `${CDN_ORIGIN}/${getWidgetPath(version)}`,
    };
}

function printVariables() {
    const version = getVersion();
    const constants = getConstants(version);

    for (const [name, variable] of Object.entries(VARIABLES)) {
        console.log(`${variable}=${constants[name]}`);
    }

    console.log(`PREVIEW_WIDGET_PATH=${getWidgetPath(version)}`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
    printVariables();
}
