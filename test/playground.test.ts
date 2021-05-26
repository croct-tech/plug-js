import {EvaluationContext} from '@croct/sdk/evaluator';
import {Token} from '@croct/sdk/token';
import {PlaygroundPlugin, Configuration, factory} from '../src/playground';
import {Tab} from '../src/sdk';
import {PLAYGROUND_ORIGIN} from '../src/constants';
import {PluginSdk} from '../src/plugin';

jest.mock('../src/constants', () => ({
    PLAYGROUND_CONNECT_URL: 'https://play.croct.com/connect.html',
    PLAYGROUND_ORIGIN: 'https://play.croct.com',
}));

beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, 'Home page', 'http://localhost');
});

afterEach(() => {
    jest.restoreAllMocks();
});

const cid = '7b0e7b3f-72d7-4045-8402-e712e6b89c20';
const appId = '96ce0758-d4c4-4aae-bac6-efb17de66488';
const tabId = 'ffe5d9df-af36-4d58-8178-51f3cf1a7504';
const sdkVersion = '0.0.1';
const evaluationContext: EvaluationContext = {
    timezone: 'America/Sao_Paulo',
    campaign: {
        content: 'content',
    },
    page: {
        title: 'Page Title',
        url: 'http://localhost',
    },
};

function getConfiguration(): Configuration {
    return {
        sdkVersion: sdkVersion,
        appId: appId,
        tokenProvider: {
            getToken: jest.fn(),
        },
        eventSubscriber: {
            removeListener: jest.fn(),
            addListener: jest.fn(),
        },
        cidAssigner: {
            assignCid: jest.fn().mockResolvedValue(cid),
        },
        contextFactory: {
            createContext: jest.fn().mockReturnValue(evaluationContext),
        },
        storage: sessionStorage,
        logger: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        },
        tab: new Tab(tabId, true),
    };
}

function mockIframe(): HTMLIFrameElement {
    const iframe: HTMLIFrameElement = document.createElement('iframe');

    const mockedAppendChild = document.body.appendChild as unknown as jest.MockInstance<any, any>;

    if (mockedAppendChild.mock !== undefined) {
        mockedAppendChild.mockRestore();
    }

    const mockedCreateElement = document.createElement as unknown as jest.MockInstance<any, any>;

    if (mockedCreateElement.mock !== undefined) {
        mockedCreateElement.mockRestore();
    }

    const createElement = document.createElement.bind(document);
    const appendChild = document.body.appendChild.bind(document.body);

    jest.spyOn(document.body, 'appendChild').mockImplementation(element => {
        const result = appendChild(element);

        if (element === iframe && iframe.contentWindow !== null) {
            jest.spyOn(iframe.contentWindow, 'postMessage');
        }

        return result;
    });

    jest.spyOn(document, 'createElement').mockImplementation(elementName => {
        if (elementName !== 'iframe') {
            return createElement(elementName);
        }

        return iframe;
    });

    return iframe;
}

describe('A Playground plugin factory', () => {
    test('should instantiate the Playground plugin', () => {
        const sdk: Partial<PluginSdk> = {
            version: sdkVersion,
            appId: appId,
            tab: new Tab(tabId, true),
            tokenStore: {
                getToken: jest.fn(),
                setToken: jest.fn(),
            },
            eventManager: {
                removeListener: jest.fn(),
                addListener: jest.fn(),
                dispatch: jest.fn(),
            },
            cidAssigner: {
                assignCid: jest.fn().mockResolvedValue(cid),
            },
            getBrowserStorage: jest.fn(),
            getTabStorage: jest.fn().mockReturnValue(sessionStorage),
            getLogger: jest.fn().mockReturnValue({
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            }),
        };

        expect(() => {
            factory({
                sdk: sdk as PluginSdk,
                options: {
                    connectionId: '123',
                },
            });
        }).not.toThrow();
    });
});

describe('A Playground plugin', () => {
    test('should not synchronize with the playground if the connection ID is not specified', async () => {
        const configuration = getConfiguration();

        const iframe = mockIframe();

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        expect(document.body.contains(iframe)).toBe(false);

        expect(configuration.logger.debug).toHaveBeenCalledWith('No connection ID found in URL');
    });

    test('should synchronize with the playground if a connection ID is specified in the URL', async () => {
        const configuration = getConfiguration();

        const token = Token.issue(appId, 'c4r0l');

        jest.spyOn(configuration.tokenProvider, 'getToken').mockReturnValue(token);

        window.history.pushState({}, 'Other page', 'index.html?__cplay=123');

        const iframe = mockIframe();

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenCalledWith(
            {
                appId: appId,
                sdkVersion: sdkVersion,
                tabId: tabId,
                token: token.toString(),
                cid: cid,
                connectionId: '123',
                context: evaluationContext,
            },
            PLAYGROUND_ORIGIN,
        );

        expect(configuration.logger.debug).toHaveBeenCalledWith('Connection ID found in URL');
    });

    test('should synchronize with the playground and omit undefined context values', async () => {
        const configuration = getConfiguration();

        const minimalContext: EvaluationContext = {
            timezone: 'America/Sao_Paulo',
        };

        jest.spyOn(configuration.contextFactory, 'createContext').mockReturnValue(minimalContext);

        window.history.pushState({}, 'Other page', 'index.html?__cplay=123');

        const iframe = mockIframe();

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                token: null,
                context: minimalContext,
            }),
            PLAYGROUND_ORIGIN,
        );
    });

    test('should give higher priority to the connection ID specified in the configuration', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        window.history.pushState({}, 'Other page', 'index.html?__cplay=321');

        const iframe = mockIframe();

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                connectionId: configuration.connectionId,
            }),
            PLAYGROUND_ORIGIN,
        );

        expect(configuration.logger.debug).toHaveBeenCalledWith('Connection ID passed in configuration');

        // Should not persist connection IDs specified in configuration
        expect(sessionStorage.getItem('connectionId')).toBeNull();
    });

    test('should abort the synchronization if the iframe window is uninitialized', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const iframe = mockIframe();

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        Object.defineProperty(iframe, 'contentWindow', {
            get: () => null,
        });

        iframe.dispatchEvent(new Event('load'));

        expect(document.contains(iframe)).toBe(false);

        expect(configuration.logger.warn).toHaveBeenCalledWith('Sync handshake failed');
    });

    test('should wait until the page load to synchronize with the playground', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const iframe = mockIframe();

        const parent = document.body.parentNode as Node;
        const body = parent.removeChild(document.body);

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        parent.appendChild(body);

        document.dispatchEvent(new Event('DOMContentLoaded'));

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                connectionId: configuration.connectionId,
            }),
            PLAYGROUND_ORIGIN,
        );
    });

    test('should restore previous connection ID from storage', async () => {
        const configuration = getConfiguration();

        sessionStorage.setItem('connectionId', '123');

        const iframe = mockIframe();

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                connectionId: '123',
            }),
            PLAYGROUND_ORIGIN,
        );

        expect(configuration.logger.debug).toHaveBeenCalledWith('Previous connection ID found');
    });

    test('should log a warning if the synchronization fails', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        jest.spyOn(configuration.cidAssigner, 'assignCid').mockRejectedValue(new Error('Unexpected error'));

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        expect(configuration.logger.warn).toHaveBeenCalledWith('Sync failed: unexpected error');
    });

    test('should resynchronize on token changes', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const addListener = jest.spyOn(configuration.eventSubscriber, 'addListener');

        let iframe = mockIframe();
        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        expect(addListener).toHaveBeenCalledWith('tokenChanged', expect.anything());

        // Initial sync

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                connectionId: configuration.connectionId,
                token: null,
            }),
            PLAYGROUND_ORIGIN,
        );

        window.dispatchEvent(new MessageEvent('message', {
            data: '123',
            origin: PLAYGROUND_ORIGIN,
        }));

        expect(document.body.contains(iframe)).toBe(false);

        expect(configuration.logger.debug).toHaveBeenLastCalledWith('Sync completed');

        // Token sync

        const token = Token.issue(appId, 'c4r0l');

        jest.spyOn(configuration.tokenProvider, 'getToken').mockReturnValue(token);

        iframe = mockIframe();

        addListener.mock.calls[0][1]({
            newToken: token,
            oldToken: null,
        });

        // Wait a few milliseconds to ensure the async callback is called
        await new Promise(resolve => window.setTimeout(resolve, 30));

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                connectionId: configuration.connectionId,
                token: token.toString(),
            }),
            PLAYGROUND_ORIGIN,
        );

        window.dispatchEvent(new MessageEvent('message', {
            data: '123',
            origin: PLAYGROUND_ORIGIN,
        }));

        expect(document.body.contains(iframe)).toBe(false);

        expect(configuration.logger.debug).toHaveBeenLastCalledWith('Sync completed');
    });

    test('should resynchronize on URL changes', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const addListener = jest.spyOn(configuration.eventSubscriber, 'addListener');

        let iframe = mockIframe();
        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        expect(addListener).toHaveBeenCalledWith('tokenChanged', expect.anything());

        // Initial sync

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                connectionId: configuration.connectionId,
                context: evaluationContext,
            }),
            PLAYGROUND_ORIGIN,
        );

        window.dispatchEvent(new MessageEvent('message', {
            data: '123',
            origin: PLAYGROUND_ORIGIN,
        }));

        expect(document.body.contains(iframe)).toBe(false);

        expect(configuration.logger.debug).toHaveBeenLastCalledWith('Sync completed');

        // Context sync

        iframe = mockIframe();

        window.history.pushState({}, 'Other page', 'example');

        const newEvaluationContext: EvaluationContext = {
            page: {
                title: 'Test',
                url: window.location.href,
            },
        };

        jest.spyOn(configuration.contextFactory, 'createContext').mockReturnValue(newEvaluationContext);

        // Wait a few milliseconds to ensure the async callback is called
        await new Promise(resolve => window.setTimeout(resolve, 30));

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                connectionId: configuration.connectionId,
                context: newEvaluationContext,
            }),
            PLAYGROUND_ORIGIN,
        );

        window.dispatchEvent(new MessageEvent('message', {
            data: '123',
            origin: PLAYGROUND_ORIGIN,
        }));

        expect(document.body.contains(iframe)).toBe(false);

        expect(configuration.logger.debug).toHaveBeenLastCalledWith('Sync completed');
    });

    test('should remove the iframe on synchronization completion', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const addEventListener = jest.spyOn(window, 'addEventListener');
        jest.spyOn(window, 'removeEventListener');

        const iframe = mockIframe();
        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        expect(iframe.contentWindow?.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                connectionId: configuration.connectionId,
            }),
            PLAYGROUND_ORIGIN,
        );

        window.dispatchEvent(new MessageEvent('message', {
            data: '123',
            origin: PLAYGROUND_ORIGIN,
        }));

        expect(window.removeEventListener).toHaveBeenCalledWith(
            addEventListener.mock.calls[0][0],
            addEventListener.mock.calls[0][1],
        );

        expect(document.body.contains(iframe)).toBe(false);

        expect(configuration.logger.debug).toHaveBeenCalledWith('Sync completed');
    });

    test('should ignore the message event from another origin', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const iframe = mockIframe();
        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        window.dispatchEvent(new MessageEvent('message', {
            data: '123',
            origin: 'foo',
        }));

        expect(document.body.contains(iframe)).toBe(true);

        expect(configuration.logger.debug).not.toHaveBeenCalledWith('Sync completed');
    });

    test('should ignore the message event with different connection ID', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const iframe = mockIframe();
        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        iframe.dispatchEvent(new Event('load'));

        window.dispatchEvent(new MessageEvent('message', {
            data: '321',
            origin: PLAYGROUND_ORIGIN,
        }));

        expect(document.body.contains(iframe)).toBe(true);

        expect(configuration.logger.debug).not.toHaveBeenCalledWith('Sync completed');
    });

    test('should remove listeners when disabled', async () => {
        const configuration = getConfiguration();
        configuration.connectionId = '123';

        const subscriberAddListener = jest.spyOn(configuration.eventSubscriber, 'addListener');
        const tabAddListener = jest.spyOn(configuration.tab, 'addListener');

        jest.spyOn(configuration.tab, 'removeListener');

        const plugin = new PlaygroundPlugin(configuration);

        await plugin.enable();

        expect(configuration.eventSubscriber.addListener).toHaveBeenLastCalledWith('tokenChanged', expect.anything());
        expect(configuration.tab.addListener).toHaveBeenLastCalledWith('urlChange', expect.anything());

        await plugin.disable();

        expect(configuration.eventSubscriber.removeListener).toHaveBeenLastCalledWith(
            'tokenChanged',
            subscriberAddListener.mock.calls[0][1],
        );

        expect(configuration.tab.addListener).toHaveBeenLastCalledWith(
            'urlChange',
            tabAddListener.mock.calls[0][1],
        );
    });
});
