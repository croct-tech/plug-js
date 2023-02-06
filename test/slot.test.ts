import {join as pathJoin} from 'path';
import {create} from 'ts-node';

const tsService = create({
    cwd: __dirname,
    transpileOnly: false,
});

const testFilename = pathJoin(__dirname, 'test.ts');

describe('Slot typing', () => {
    const uniqueId = Math.random()
        .toString(36)
        .substring(7);

    const slotMapping = `
        type HorizontalBanner = {
            title: string,
        };
        
        type VerticalBanner = {
            image: string,
        };
        
        type HybridBanner = HorizontalBanner & {_type: 'horizontal-banner'} 
        | VerticalBanner & {_type: 'vertical-banner'};
    
        type HomeBanner = {
            title: string,
            subtitle: string,
        };
        
        declare module '../src/slot' {
            type HomeBannerV1 = HomeBanner & {_component: 'banner@1' | null};
            type HybridBannerV1 = HybridBanner & {_component: 'hybrid-banner@1' | null};
        
            interface VersionedSlotMap {
                'home-banner': {
                    'latest': HomeBannerV1,
                    '1': HomeBannerV1,
                };
                'hybrid-banner': {
                    'latest': HybridBannerV1,
                    '1': HybridBannerV1,
                };
            }
        }
    `;

    const componentMapping = `        
        type Banner = {
            title: string,
            subtitle: string,
        };
        
        type HorizontalBanner = {
            title: string,
        };
        
        type VerticalBanner = {
            image: string,
        };
        
        type HybridBanner = HorizontalBanner & {_type: 'horizontal-banner'}
        | VerticalBanner & {_type: 'vertical-banner'};
 
        declare module '../src/component' {
            interface VersionedComponentMap {
                'banner': {
                    'latest': Banner,
                    '1': Banner,
                };
                'hybrid-banner': {
                    'latest': HybridBanner,
                    '1': HybridBanner,
                };
            }
        }
    `;

    type CodeOptions = {
        imports?: string[],
        mapping?: {
            slot?: boolean,
            component?: boolean,
        },
        expand?: boolean,
        type: string,
    };

    function assembleCode(options: CodeOptions): string {
        const {type, imports = [], mapping = {}, expand = true} = options;
        const header = `import {${imports.join(', ')}} from '../src/slot';\n`
            + 'export type Expand<T> = T extends infer O ? {[K in keyof O]: O[K]} : never;\n';

        const prefix = header
            + (mapping.slot ?? false ? slotMapping : '')
            + (mapping.component ?? false ? componentMapping : '');

        return `${prefix}\nexport type test_${uniqueId} = ${expand ? `Expand<${type}>` : type};`;
    }

    function compileCode(opts: CodeOptions): void {
        tsService.compile(assembleCode(opts), testFilename);
    }

    function getTypeName(opts: CodeOptions): string {
        const code = assembleCode(opts);
        const anchor = `type test_${uniqueId}`;

        const info = tsService.getTypeInfo(code, testFilename, code.indexOf(anchor) + anchor.length);

        const match = info.name.match(/^[^=]+=\s*(.+)$/s);

        if (match !== null) {
            return match[1].replace(/\s*\n\s*/g, '');
        }

        return info.name;
    }

    it('should export a SlotId type that fallbacks to string when no slot mapping exists', () => {
        const code: CodeOptions = {
            imports: ['SlotId'],
            type: 'SlotId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('string');
    });

    it('should export a SlotId type that resolves to a union of all slot IDs', () => {
        const code: CodeOptions = {
            imports: ['SlotId'],
            mapping: {
                slot: true,
            },
            type: 'SlotId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"home-banner" | "hybrid-banner"');
    });

    it('should export a VersionedSlotId type that fallbacks to string when no slot mapping exists', () => {
        const code: CodeOptions = {
            imports: ['VersionedSlotId'],
            type: 'VersionedSlotId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('string');
    });

    it('should export a VersionedSlotId type that resolves to a union of all slot IDs and versions', () => {
        const code: CodeOptions = {
            imports: ['VersionedSlotId'],
            mapping: {
                slot: true,
            },
            type: 'VersionedSlotId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe(
            [
                '"hybrid-banner@1"',
                '"home-banner"',
                '"hybrid-banner"',
                '"home-banner@latest"',
                '"home-banner@1"',
                '"hybrid-banner@latest"',
            ].join(' | '),
        );
    });

    it('should export a SlotVersion type that resolves to "latest" when no slot mapping exists', () => {
        const code: CodeOptions = {
            imports: ['SlotVersion'],
            type: 'SlotVersion',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"latest"');
    });

    it('should export a SlotVersion that resolves to a union of all slot versions', () => {
        const code: CodeOptions = {
            imports: ['SlotVersion'],
            mapping: {
                slot: true,
            },
            type: 'SlotVersion',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"latest" | "1"');
    });

    it('should export a SlotVersionId type that resolves to never when no slot mapping exists', () => {
        const code: CodeOptions = {
            imports: ['SlotVersionId'],
            type: 'SlotVersionId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('never');
    });

    it('should export a SlotVersionId type that resolves to a union of all canonical version IDs', () => {
        const code: CodeOptions = {
            imports: ['SlotVersionId'],
            mapping: {
                slot: true,
            },
            type: 'SlotVersionId',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('"hybrid-banner@1" | "home-banner@1"');
    });

    it('should export a CompatibleSlotContent type that resolves to never when no slot mapping exists', () => {
        const code: CodeOptions = {
            imports: ['CompatibleSlotContent'],
            expand: false,
            type: 'CompatibleSlotContent',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('never');
    });

    it('should export a CompatibleSlotContent type that resolves the slot content type for a component', () => {
        const code: CodeOptions = {
            imports: ['CompatibleSlotContent'],
            mapping: {
                component: true,
            },
            expand: false,
            type: 'CompatibleSlotContent<"banner@1">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('Banner & {_component: "banner@1";}');
    });

    it('should export a CompatibleSlotContent type that resolves the slot content type for multiple components', () => {
        const code: CodeOptions = {
            imports: ['CompatibleSlotContent'],
            mapping: {
                component: true,
            },
            expand: false,
            type: 'CompatibleSlotContent<"banner@1" | "hybrid-banner@1">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe(
            '(Banner & {_component: "banner@1";})'
            + ' | (HorizontalBanner & {_type: \'horizontal-banner\';} & {_component: "hybrid-banner@1";})'
            + ' | (VerticalBanner & {_type: \'vertical-banner\';} & {_component: "hybrid-banner@1";})',
        );
    });

    it('should export a SlotContent type that resolves to JsonObject when no slot mapping exists', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            mapping: {
                slot: false,
                component: false,
            },
            expand: false,
            type: 'SlotContent',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('JsonObject & {_component: string | null;}');
    });

    it('should export a SlotContent type that resolves to a slot content', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            mapping: {
                slot: true,
            },
            expand: false,
            type: 'SlotContent<"home-banner">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('HomeBanner & {_component: \'banner@1\' | null;}');
    });

    it('should export a SlotContent type that resolves to multiple slot contents', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            mapping: {
                slot: true,
            },
            expand: false,
            type: 'SlotContent<"home-banner" | "hybrid-banner">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('HomeBannerV1 | HybridBannerV1');
    });

    it('should export a SlotContent type that resolves to JsonObject when the slot is unknown', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            expand: false,
            type: 'SlotContent<"unknown-slot">',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('JsonObject & {_component: string | null;}');
    });

    it('should export a SlotContent type that resolves to given JsonObject subtype when the slot is unknown', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            expand: false,
            type: 'SlotContent<any, {test: boolean}>',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('{test: boolean;}');
    });

    it('should export a SlotContent type that resolves to a union of components when the slot is unknown', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            mapping: {
                slot: false,
                component: true,
            },
            expand: false,
            type: 'SlotContent<any>',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe(
            '(Banner & {_component: "banner@1" | null;})'
            + ' | (HorizontalBanner & {_type: \'horizontal-banner\';} & {_component: "hybrid-banner@1" | null;})'
            + ' | (VerticalBanner & {...;} & {_component: "hybrid-banner@1" | null;})',
        );
    });

    it(
        'should export a SlotContent type that resolves JsonObject when '
        + 'the slot is unknown and no component mapping exists',
        () => {
            const code: CodeOptions = {
                imports: ['SlotContent'],
                mapping: {
                    slot: true,
                    component: false,
                },
                expand: false,
                type: 'SlotContent<any>',
            };

            expect(() => compileCode(code)).not.toThrow();

            expect(getTypeName(code)).toBe('JsonObject & {_component: string | null;}');
        },
    );

    it('should export a SlotContent type that resolves to given JsonObject subtype when the slot is known', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            mapping: {
                slot: true,
            },
            expand: false,
            type: 'SlotContent<"home-banner", {test: boolean}>',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('{test: boolean;}');
    });

    it('should export a SlotContent type that resolves to given JsonObject subtype when no slot mapping exists', () => {
        const code: CodeOptions = {
            imports: ['SlotContent'],
            expand: false,
            type: 'SlotContent<"home-banner", {test: boolean}>',
        };

        expect(() => compileCode(code)).not.toThrow();

        expect(getTypeName(code)).toBe('{test: boolean;}');
    });
});
