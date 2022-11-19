import {InMemoryTokenStore, Token} from '@croct/sdk/token';
import {PluginSdk} from '../src/plugin';
import {Configuration, factory, PreviewPlugin} from '../src/preview';
import {PREVIEW_WIDGET_ORIGIN} from '../src/constants';

jest.mock(
    '../src/constants',
    () => ({
        PREVIEW_WIDGET_URL: 'https://cdn.croct.com/preview.html',
        PREVIEW_WIDGET_ORIGIN: 'https://cdn.croct.com',
    }),
);

describe('A preview plugin factory', () => {
    it('should instantiate the Preview plugin', () => {
        const sdk: Partial<PluginSdk> = {
            previewTokenStore: {
                getToken: jest.fn(),
                setToken: jest.fn(),
            },
            getLogger: jest.fn()
                .mockReturnValue({
                    debug: jest.fn(),
                    info: jest.fn(),
                    warn: jest.fn(),
                    error: jest.fn(),
                }),
        };

        expect(() => {
            factory({
                sdk: sdk as PluginSdk,
                options: {},
            });
        }).not.toThrow();
    });
});

describe('A Preview plugin', () => {
    beforeEach(() => {
        window.history.replaceState({}, 'Home page', 'http://localhost');
        document.body.innerHTML = '';

        const {location} = window;

        Object.defineProperty(
            window,
            'location',
            {
                value: {
                    get href() {
                        return location.href;
                    },
                    assign: jest.fn(),
                    replace: jest.fn(),
                },
                configurable: true,
                enumerable: true,
                writable: true,
            },
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    const tokenData = {
        headers: {
            typ: 'JWT',
            alg: 'none',
        },
        payload: {
            iss: 'https://croct.io',
            aud: 'https://croct.io',
            iat: 1440979100,
            exp: 1440979200,
            metadata: {
                experienceName: 'Developers experience',
                experimentName: 'Developers experiment',
                audienceName: 'Developers audience',
                variantName: 'JavaScript Developers',
            },
        },
    };

    const token = Token.of(tokenData.headers, tokenData.payload);

    const configuration: Configuration = {
        tokenStore: new InMemoryTokenStore(),
        logger: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        },
    };

    it('should do nothing if no preview token exists', () => {
        const plugin = new PreviewPlugin(configuration);

        expect(localStorage.length).toBe(0);

        expect(document.body.children.length).toBe(0);

        plugin.enable();

        expect(localStorage.length).toBe(0);

        expect(document.body.children.length).toBe(0);
    });

    it('should remove the preview parameter from the URL', () => {
        const plugin = new PreviewPlugin(configuration);

        window.history.replaceState({}, 'Home page', `http://localhost?croct-preview=${token.toString()}`);

        plugin.enable();

        expect(window.location.href).toBe('http://localhost/');
    });

    it('should store non-expired tokens', () => {
        const plugin = new PreviewPlugin(configuration);
        const {iat} = token.getPayload();

        jest.useFakeTimers()
            .setSystemTime(iat * 1000);

        window.history.replaceState({}, 'Home page', `http://localhost?croct-preview=${token.toString()}`);

        expect(document.body.children.length).toBe(0);

        plugin.enable();

        expect(configuration.tokenStore.getToken()).toEqual(token);

        expect(document.body.children.length).toBe(1);
    });

    it('should ignore expired tokens and remove existing tokens', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        const {exp = 0} = token.getPayload();

        jest.useFakeTimers()
            .setSystemTime(exp * 1000 + 1);

        window.history.replaceState({}, 'Home page', `http://localhost?croct-preview=${token.toString()}`);

        expect(document.body.children.length).toBe(0);

        plugin.enable();

        expect(configuration.tokenStore.getToken()).toBe(null);

        expect(document.body.children.length).toBe(0);

        expect(configuration.logger.debug).toHaveBeenCalledWith('Preview token expired.');
    });

    it('should remove the stored token when leaving the preview', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        window.history.replaceState({}, 'Home page', 'http://localhost?croct-preview=exit');

        plugin.enable();

        expect(configuration.tokenStore.getToken()).toBe(null);

        expect(window.location.href).toBe('http://localhost/');

        expect(configuration.logger.debug).toHaveBeenCalledWith('Exiting preview mode.');
    });

    it('should log invalid token', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        window.history.replaceState({}, 'Home page', 'http://localhost?croct-preview=invalid');

        plugin.enable();

        expect(configuration.tokenStore.getToken()).toBe(null);

        expect(configuration.logger.warn)
            .toHaveBeenCalledWith('Invalid preview token: the token is malformed.');
    });

    it('should ignore missing metadata', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(Token.of(tokenData.headers, {
            ...tokenData.payload,
            metadata: null,
        }));

        plugin.enable();

        const widget = document.body.querySelector('iframe') as HTMLIFrameElement;

        const src = new URL(widget.getAttribute('src')!);

        expect(src.searchParams.has('experience')).toBe(false);
        expect(src.searchParams.has('experiment')).toBe(false);
        expect(src.searchParams.has('audience')).toBe(false);
        expect(src.searchParams.has('variant')).toBe(false);
    });

    it('should insert the widget', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        plugin.enable();

        const widget = document.body.querySelector('iframe') as HTMLIFrameElement;

        expect(widget.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');

        expect(widget.style).toEqual(expect.objectContaining({
            position: 'fixed',
            width: '0px',
            height: '0px',
            right: '0px',
            bottom: '0px',
            overflow: 'hidden',
            zIndex: '2147483647',
        }));

        const src = new URL(widget.getAttribute('src')!);

        const {metadata} = tokenData.payload;

        expect(src.searchParams.get('experience')).toBe(metadata.experienceName);
        expect(src.searchParams.get('experiment')).toBe(metadata.experimentName);
        expect(src.searchParams.get('audience')).toBe(metadata.audienceName);
        expect(src.searchParams.get('variant')).toBe(metadata.variantName);
    });

    it('should ignore messages from unknown origins', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        plugin.enable();

        window.dispatchEvent(
            new MessageEvent(
                'message',
                {
                    source: window,
                    origin: 'http://localhost',
                    data: {
                        type: 'croct:preview:exit',
                    },
                },
            ),
        );

        expect(document.body.querySelector('iframe')).not.toBe(null);
    });

    it('should resize the iframe when the widget size changes', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        plugin.enable();

        const widget = document.body.querySelector('iframe') as HTMLIFrameElement;

        expect(widget.style).toEqual(expect.objectContaining({
            width: '0px',
            height: '0px',
        }));

        window.dispatchEvent(
            new MessageEvent(
                'message',
                {
                    source: window,
                    origin: PREVIEW_WIDGET_ORIGIN,
                    data: {
                        type: 'croct:preview:resize',
                        width: 100,
                        height: 200,
                    },
                },
            ),
        );

        expect(widget.style).toEqual(expect.objectContaining({
            width: '100px',
            height: '200px',
        }));
    });

    it('should reload the page leaving the preview', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        plugin.enable();

        window.dispatchEvent(
            new MessageEvent(
                'message',
                {
                    source: window,
                    origin: PREVIEW_WIDGET_ORIGIN,
                    data: {
                        type: 'croct:preview:leave',
                    },
                },
            ),
        );

        expect(window.location.replace).toHaveBeenCalledWith('http://localhost/?croct-preview=exit');
    });

    it('should remove widget', () => {
        const plugin = new PreviewPlugin(configuration);

        configuration.tokenStore.setToken(token);

        plugin.enable();

        expect(document.body.querySelector('iframe')).not
            .toBe(null);

        plugin.disable();

        expect(document.body.querySelector('iframe')).toBe(null);
    });
});
