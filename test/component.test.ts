import {join as pathJoin} from 'path';
import {create} from 'ts-node';

const tsService = create({
    cwd: __dirname,
    transpileOnly: false,
});

const testFilename = pathJoin(__dirname, 'test.ts');

describe('Component typing', () => {
    const uniqueId = Math.random()
        .toString(36)
        .substring(7);

    const componentMapping = `        
        type Banner = {
            title: string,
            subtitle: string,
        };
        
        type Carousel = {
            title: string,
            subtitle: string,
        };
 
        declare module '../src/component' {
            interface VersionedComponentMap {
                'banner': {
                    'latest': Banner,
                    '1': Banner,
                };
                'carousel': {
                    'latest': Carousel,
                    '1': Carousel,
                };
            }
        }
    `;

    type CodeOptions = {
        imports?: string[],
        mapping: boolean,
        expand?: boolean,
        type: string,
    };

    function assembleCode(options: CodeOptions): string {
        const {type, imports = [], mapping, expand = true} = options;
        const header = `import {${imports.join(', ')}} from '../src/component';\n`
            + 'export type Expand<T> = T extends infer O ? {[K in keyof O]: O[K]} : never;\n'
            + 'export type Preserve<T> = T & Record<never, never>;\n';

        const prefix = header + (mapping ? componentMapping : '');

        return `${prefix}\nexport type test_${uniqueId} = ${expand ? `Expand<${type}>` : `Preserve<${type}>`};`;
    }

    function compileCode(opts: CodeOptions): void {
        tsService.compile(assembleCode(opts), testFilename);
    }

    function getTypeName(opts: CodeOptions): string {
        const code = assembleCode(opts);
        const anchor = `type test_${uniqueId}`;

        const info = tsService.getTypeInfo(code, testFilename, code.indexOf(anchor) + anchor.length);

        const match = info.name.match(/^[^=]+=\s*\(?(.+?)\)?( & Record<never, never>)?$/);

        if (match !== null) {
            return match[1].replace(/\s*\n\s*/g, '');
        }

        return info.name;
    }

    it('should export a ComponentId type that fallbacks to string when no component mapping exists', () => {
        const code: CodeOptions = {
            imports: ['ComponentId'],
            mapping: false,
            type: 'ComponentId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('string');
    });

    it('should export a ComponentId type that resolves to a union of all component IDs', () => {
        const code: CodeOptions = {
            imports: ['ComponentId'],
            mapping: true,
            type: 'ComponentId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"banner" | "carousel"');
    });

    it('should export a VersionedComponentId type that fallbacks to string when no component mapping exists', () => {
        const code: CodeOptions = {
            imports: ['VersionedComponentId'],
            mapping: false,
            type: 'VersionedComponentId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('string');
    });

    it('should export a VersionedComponentId type that resolves to a union of all component IDs and versions', () => {
        const code: CodeOptions = {
            imports: ['VersionedComponentId'],
            mapping: true,
            type: 'VersionedComponentId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe(
            [
                '"banner"',
                '"carousel"',
                '"banner@latest"',
                '"banner@1"',
                '"carousel@latest"',
                '"carousel@1"',
            ].join(' | '),
        );
    });

    it('should export a ComponentVersion type that resolves to "latest" when no component mapping exists', () => {
        const code: CodeOptions = {
            imports: ['ComponentVersion'],
            mapping: false,
            type: 'ComponentVersion',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"latest"');
    });

    it('should export a ComponentVersion that resolves to a union of all component versions', () => {
        const code: CodeOptions = {
            imports: ['ComponentVersion'],
            mapping: true,
            type: 'ComponentVersion',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"latest" | "1"');
    });

    it('should export a ComponentVersionId type that resolves to never when no component mapping exists', () => {
        const code: CodeOptions = {
            imports: ['ComponentVersionId'],
            mapping: false,
            type: 'ComponentVersionId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('never');
    });

    it('should export a ComponentVersionId type that resolves to a union of all canonical versions IDs', () => {
        const code: CodeOptions = {
            imports: ['ComponentVersionId'],
            mapping: true,
            type: 'ComponentVersionId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"banner@1" | "carousel@1"');
    });

    it('should export a ComponentContent type that resolves to JsonObject when no component mapping exists', () => {
        const code: CodeOptions = {
            imports: ['ComponentContent', 'VersionedComponentId'],
            mapping: false,
            expand: false,
            type: 'ComponentContent<VersionedComponentId>',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('JsonObject');
    });

    it('should export a ComponentContent type that resolves to a component content', () => {
        const code: CodeOptions = {
            imports: ['ComponentContent'],
            mapping: true,
            expand: false,
            type: 'ComponentContent<"banner">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('Banner');
    });

    it('should export a ComponentContent type that resolves to multiple component contents', () => {
        const code: CodeOptions = {
            imports: ['ComponentContent'],
            mapping: true,
            expand: false,
            type: 'ComponentContent<"banner" | "carousel">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('Banner | Carousel');
    });

    it('should export a ComponentContent type that resolves to JsonObject when the component is unknown', () => {
        const code: CodeOptions = {
            imports: ['ComponentContent'],
            mapping: true,
            expand: false,
            type: 'ComponentContent<any>',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('JsonObject');
    });

    it('should export a ComponentContent type that resolves to JsonObject when the component known', () => {
        const code: CodeOptions = {
            imports: ['ComponentContent'],
            mapping: false,
            expand: false,
            type: 'ComponentContent<"unknown-component">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('JsonObject');
    });
});
