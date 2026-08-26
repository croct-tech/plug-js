#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {getConstants, getVersion} from './release-config.mjs';

const BUILD_DIR = path.resolve('build');
const PACKAGE_JSON = path.join(BUILD_DIR, 'package.json');
const ROOT_FILES = ['LICENSE', 'README.md'];
const PLACEHOLDER_PATTERN = /<@(\w+)@>/g;
const TEXT_FILE_PATTERN = /\.(?:js|cjs|mjs|ts|cts|mts|json|map)$/;

function findFiles(dir, pattern, fileList = []) {
    for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);

        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, pattern, fileList);
        } else if (pattern.test(file)) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

function copyRootFiles() {
    for (const file of ROOT_FILES) {
        fs.copyFileSync(path.resolve(file), path.join(BUILD_DIR, file));
    }

    console.log(`✅ Copied ${ROOT_FILES.join(', ')}`);
}

function updateVersion(version) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));

    pkg.version = version;

    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2));

    console.log(`✅ Set version to ${version}`);
}

function fixSourceMaps() {
    const maps = findFiles(BUILD_DIR, /\.map$/);

    for (const file of maps) {
        const content = fs.readFileSync(file, 'utf-8');

        fs.writeFileSync(file, content.replace(/\.\.\/src/g, 'src'));
    }

    console.log(`✅ Fixed source paths in ${maps.length} source map(s)`);
}

function replaceConstants(constants) {
    for (const [name, value] of Object.entries(constants)) {
        if (typeof value !== 'string' || value === '') {
            throw new Error(`The constant "${name}" resolved to an empty value.`);
        }
    }

    const files = findFiles(BUILD_DIR, /^constants\./);

    if (files.length === 0) {
        throw new Error('No constants file found in the build directory.');
    }

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');

        fs.writeFileSync(
            file,
            content.replace(PLACEHOLDER_PATTERN, (placeholder, name) => constants[name] ?? placeholder),
        );
    }

    console.log(`✅ Replaced constants in ${files.length} file(s)`);
}

function checkPlaceholders() {
    const unresolved = [];

    for (const file of findFiles(BUILD_DIR, TEXT_FILE_PATTERN)) {
        const matches = fs.readFileSync(file, 'utf-8').matchAll(PLACEHOLDER_PATTERN);

        for (const [placeholder] of matches) {
            unresolved.push(`${path.relative(BUILD_DIR, file)}: ${placeholder}`);
        }
    }

    if (unresolved.length > 0) {
        throw new Error(`Unresolved placeholders found:\n${unresolved.join('\n')}`);
    }

    console.log('✅ No unresolved placeholders left');
}

function prepareRelease() {
    const version = getVersion();

    copyRootFiles();
    updateVersion(version);
    fixSourceMaps();
    replaceConstants(getConstants(version));
    checkPlaceholders();
}

prepareRelease();
