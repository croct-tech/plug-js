import {SdkFacade, Configuration as SdkFacadeConfiguration} from '@croct/sdk/facade/sdkFacade';
import {FetchOptions} from '@croct/sdk/facade/contentFetcherFacade';
import {JsonObject} from '@croct/json';
import {loadSlotContent} from '@croct/content';
import {Logger} from '../src/sdk';
import {Plugin, PluginFactory} from '../src/plugin';
import {GlobalPlug} from '../src/plug';
import {CDN_URL} from '../src/constants';
import {Token} from '../src/sdk/token';

jest.mock(
    '../src/constants',
    () => ({
        CDN_URL: 'https://cdn.croct.io/js/v1/lib/plug.js',
    }),
);

jest.mock(
    '@croct/content',
    () => ({
        __esModule: true,
        loadSlotContent: jest.fn().mockResolvedValue(null),
    }),
);

describe('The Croct plug', () => {
    const APP_ID = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';
    const APP_CDN_URL = `${CDN_URL}?appId=${APP_ID}`;
    const ENV_VARS = process.env;

    let croct: GlobalPlug;

    beforeEach(() => {
        process.env = {...ENV_VARS};

        delete process.env.NODE_ENV;

        croct = new GlobalPlug();

        jest.clearAllMocks();
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        process.env = ENV_VARS;

        await croct.unplug();
    });

    it('should disallow plugin overriding', () => {
        croct.extend(
            'foo',
            () => ({
                enable: jest.fn(),
            }),
        );

        function override(): void {
            croct.extend(
                'foo',
                () => ({
                    enable: jest.fn(),
                }),
            );
        }

        expect(override).toThrow('Another plugin is already registered with name "foo"');
    });

    it('should fail to initialize if the app ID is not specified and cannot be auto-detected', () => {
        expect(() => croct.plug()).toThrow('The app ID must be specified when it cannot be auto-detected.');
    });

    it('should auto-detect app ID when loaded using an application-specific tag', () => {
        const script: HTMLScriptElement = window.document.createElement('script');

        script.src = APP_CDN_URL;

        window.document
            .head
            .appendChild(script);

        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            test: false,
        };

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug();

        expect(initialize).toHaveBeenCalledWith(config);
    });

    it('should fail if the auto-detected app ID and the specified app ID are conflicting', () => {
        const script: HTMLScriptElement = window.document.createElement('script');

        script.src = APP_CDN_URL;

        window.document
            .head
            .appendChild(script);

        function plug(): void {
            croct.plug({appId: '00000000-0000-0000-0000-000000000000'});
        }

        expect(plug).toThrow('The specified app ID and the auto-detected app ID are conflicting.');
    });

    it('should log a warning message when the app ID is specified unnecessarily', () => {
        const script: HTMLScriptElement = window.document.createElement('script');

        script.src = APP_CDN_URL;

        window.document
            .head
            .appendChild(script);

        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            logger: logger,
        });

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(
            'It is strongly recommended omitting the "appId" option when using '
            + 'the application-specific tag as it is detected automatically.',
        ));
    });

    it('should initialize the SDK using the specified configuration', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            track: false,
            debug: false,
            test: true,
            tokenScope: 'isolated',
            userId: 'c4r0l',
            eventMetadata: {
                foo: 'bar',
            },
        };

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(config);
    });

    it.each([
        'test',
        'development',
        'production',
    ])('should enable the test mode on test environments', environment => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
        };

        process.env.NODE_ENV = environment;

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({test: environment === 'test'}));
    });

    it.each([
        true,
        false,
    ])('should enable the test mode based on CROCT_TEST_MODE environment variable', value => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
        };

        process.env.CROCT_TEST_MODE = `${value}`;

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({test: value}));
    });

    it('should prioritize the specified test mode over environment variables', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            test: false,
        };

        process.env.NODE_ENV = 'test';
        process.env.CROCT_TEST_MODE = 'true';

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({test: false}));
    });

    it('should prioritize the test mode specified via CROCT_TEST_MODE over NODE_ENV', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
        };

        process.env.NODE_ENV = 'test';
        process.env.CROCT_TEST_MODE = 'false';

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({test: false}));
    });

    it('should log failures initializing plugins', () => {
        croct.extend('foo', () => {
            throw new Error('Failure');
        });

        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            logger: logger,
            plugins: {foo: true},
        });

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to initialize plugin "foo": failure'),
        );
    });

    it('should log an error if a plugin is not registered', () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            plugins: {foo: true},
            logger: logger,
        });

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Plugin "foo" is not registered.'),
        );
    });

    it('should log an error if a plugin options is invalid', () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const factory: PluginFactory = jest.fn();

        croct.extend('foo', factory);

        croct.plug({
            appId: APP_ID,
            plugins: {foo: null},
            logger: logger,
        });

        expect(factory).not.toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Invalid options for plugin "foo", expected either boolean or object but got null'),
        );
    });

    it('should not initialize disabled plugins', () => {
        const factory: PluginFactory = jest.fn();

        croct.extend('foo', factory);

        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            logger: logger,
            plugins: {foo: false},
        });

        expect(factory).not.toHaveBeenCalled();

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Plugin "foo" is declared but not enabled'),
        );
    });

    it('should initialize the declared plugins', () => {
        const fooFactory: PluginFactory = jest.fn().mockImplementation(({sdk}) => {
            sdk.getLogger('namespace');
            sdk.getTabStorage('namespace');
            sdk.getBrowserStorage('namespace');
        });

        const barFactory: PluginFactory = jest.fn();

        croct.extend('foo', fooFactory);
        croct.extend('bar', barFactory);

        const config: SdkFacadeConfiguration = {appId: APP_ID};

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        const getLogger = jest.spyOn(sdkFacade, 'getLogger');
        const getTabStorage = jest.spyOn(sdkFacade, 'getTabStorage');
        const getBrowserStorage = jest.spyOn(sdkFacade, 'getBrowserStorage');

        croct.plug({
            appId: APP_ID,
            plugins: {
                foo: true,
                bar: {flag: true},
            },
        });

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(fooFactory).toHaveBeenCalledWith(expect.objectContaining({options: {}}));
        expect(barFactory).toHaveBeenCalledWith(expect.objectContaining({options: {flag: true}}));

        expect(getLogger).toHaveBeenCalledWith('Plugin', 'foo', 'namespace');
        expect(getTabStorage).toHaveBeenCalledWith('Plugin', 'foo', 'namespace');
        expect(getBrowserStorage).toHaveBeenCalledWith('Plugin', 'foo', 'namespace');
    });

    it('should handle failures enabling plugins', async () => {
        const plugin: Plugin = {
            enable: jest.fn().mockReturnValue(Promise.reject(new Error('Failure'))),
        };

        croct.extend('foo', () => plugin);

        croct.plug({
            appId: APP_ID,
            plugins: {foo: true},
        });

        expect(plugin.enable).toHaveBeenCalled();

        await expect(croct.plugged).resolves.toBe(croct);
    });

    it('should wait for the plugins to initialize', async () => {
        let loadFooPlugin: () => void = jest.fn();

        const fooEnable = jest.fn().mockImplementation(
            () => new Promise<void>(resolve => {
                loadFooPlugin = resolve;
            }),
        );

        croct.extend(
            'foo',
            () => ({
                enable: fooEnable,
            }),
        );

        const barEnable = jest.fn();

        croct.extend(
            'bar',
            () => ({
                enable: barEnable,
            }),
        );

        croct.plug({
            appId: APP_ID,
            plugins: {
                foo: true,
                bar: true,
            },
        });

        const plugged = jest.fn();
        const promise = croct.plugged.then(plugged);

        expect(fooEnable).toHaveBeenCalledTimes(1);
        expect(barEnable).toHaveBeenCalledTimes(1);
        expect(plugged).not.toHaveBeenCalled();

        await new Promise(resolve => {
            setTimeout(resolve, 15);
        });

        expect(plugged).not.toHaveBeenCalled();

        loadFooPlugin();

        await promise;

        expect(plugged).toHaveBeenCalled();
    });

    it('should not fail if plugged more than once', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);
        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    it('should determine whether it is initialized', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};

        expect(croct.initialized).toBe(false);

        croct.plug(config);

        expect(croct.initialized).toBe(true);

        await croct.unplug();

        expect(croct.initialized).toBe(false);
    });

    it('should provide a callback that is called when the plug is plugged in', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};

        // First time
        const firstCallback = jest.fn();

        const firstPromise = croct.plugged.then(firstCallback);

        await new Promise(resolve => {
            setTimeout(resolve, 15);
        });

        expect(firstCallback).not.toHaveBeenCalled();

        croct.plug(config);

        await firstPromise;

        expect(firstCallback).toHaveBeenCalledWith(croct);

        // Second time
        await croct.unplug();

        const secondCallback = jest.fn();

        const secondPromise = croct.plugged.then(secondCallback);

        await new Promise(resolve => {
            setTimeout(resolve, 15);
        });

        expect(secondCallback).not.toHaveBeenCalled();

        croct.plug(config);

        await secondPromise;

        expect(secondCallback).toHaveBeenCalledWith(croct);
    });

    it('should provide a callback that is called when the current pending events are flushed', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};

        const sdkFacade = SdkFacade.init(config);

        const flushed = jest.fn().mockResolvedValue(undefined);

        Object.defineProperty(sdkFacade.tracker, 'flushed', {
            get: flushed,
        });

        jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        await expect(croct.flushed).resolves.toBe(croct);

        expect(flushed).toHaveBeenCalledTimes(1);
    });

    it('should provide a tracker facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(croct.tracker).toBe(sdkFacade.tracker);
    });

    it('should not provide a tracker facade if unplugged', () => {
        expect(() => croct.tracker).toThrow('Croct is not plugged in.');
    });

    it('should provide a user facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(croct.user).toBe(sdkFacade.user);
    });

    it('should not provide an evaluator facade if unplugged', () => {
        expect(() => croct.evaluator).toThrow('Croct is not plugged in.');
    });

    it('should provide an evaluator facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(croct.evaluator).toBe(sdkFacade.evaluator);
    });

    it('should not provide a user facade if unplugged', () => {
        expect(() => croct.user).toThrow('Croct is not plugged in.');
    });

    it('should provide a session facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(croct.session).toBe(sdkFacade.session);
    });

    it('should not provide a session facade if unplugged', () => {
        expect(() => croct.session).toThrow('Croct is not plugged in.');
    });

    it('should determine whether the user is anonymous', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(croct.isAnonymous()).toBe(sdkFacade.user.isAnonymous());
    });

    it('should fail to determine whether the user is anonymous if unplugged', () => {
        expect(() => croct.isAnonymous()).toThrow('Croct is not plugged in.');
    });

    it('should provide the user ID', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            userId: '3r1ck',
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(croct.getUserId()).toBe(config.userId);
    });

    it('should fail to provide the user ID if unplugged', () => {
        expect(() => croct.getUserId()).toThrow('Croct is not plugged in.');
    });

    it('should reject non-string user IDs', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(() => croct.identify(1235 as unknown as string)).toThrow('The user ID must be a string.');
    });

    it('should allow to identify the user', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        croct.identify('3r1ck');

        expect(croct.getUserId()).toBe('3r1ck');
    });

    it('should not allow to identify the user if unplugged', () => {
        expect(() => croct.identify('3r1ck')).toThrow('Croct is not plugged in.');
    });

    it('should allow to anonymize the user', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            userId: '3r1ck',
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        expect(croct.isAnonymous()).toBeFalsy();

        croct.anonymize();

        expect(croct.isAnonymous()).toBeTruthy();
    });

    it('should not allow to anonymize the user if unplugged', () => {
        expect(() => croct.anonymize()).toThrow('Croct is not plugged in.');
    });

    it('should allow to set a user token', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const setToken = jest.spyOn(sdkFacade, 'setToken');

        const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNGIz'
            + 'LTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N'
            + '0LmlvIiwiaWF0IjowLCJzdWIiOiJjNHIwbCJ9.';

        croct.setToken(token);

        expect(setToken).toHaveBeenCalledWith(Token.parse(token));
    });

    it('should not allow to set a user token if unplugged', () => {
        expect(() => croct.setToken('')).toThrow('Croct is not plugged in.');
    });

    it('should allow to unset a user token', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const unsetToken = jest.spyOn(sdkFacade, 'unsetToken');

        croct.unsetToken();

        expect(unsetToken).toHaveBeenCalled();
    });

    it('should not allow to unset a user token if unplugged', () => {
        expect(() => croct.unsetToken()).toThrow('Croct is not plugged in.');
    });

    it('should allow to track events', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const track = jest.spyOn(sdkFacade.tracker, 'track').mockResolvedValue({
            type: 'userSignedUp',
            userId: 'c4r0l',
        });

        await croct.track('userSignedUp', {userId: 'c4r0l'});

        expect(track).toHaveBeenCalledWith('userSignedUp', {userId: 'c4r0l'});
    });

    it('should not allow to track events if unplugged', () => {
        expect(() => croct.track('userSignedUp', {userId: 'c4r0l'})).toThrow('Croct is not plugged in.');
    });

    it('should allow to evaluate queries', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockResolvedValue('carol');

        const promise = croct.evaluate('user\'s name', {timeout: 5});

        await expect(promise).resolves.toBe('carol');

        expect(evaluate).toHaveBeenCalledWith('user\'s name', {timeout: 5});
    });

    it('should log an error when the query evaluation fails', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            logger: logger,
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockRejectedValue(new Error('Reason'));

        const query = '"a long query with spaces"';

        const promise = croct.evaluate(query, {timeout: 5});

        await expect(promise).rejects.toThrow('Reason');

        expect(evaluate).toHaveBeenCalledWith(query, {timeout: 5});

        expect(logger.error).toHaveBeenCalledWith(
            '[Croct] Failed to evaluate query ""a long query with s...": reason',
        );
    });

    it('should not allow to evaluate query if unplugged', () => {
        expect(() => croct.evaluate('foo', {timeout: 5})).toThrow('Croct is not plugged in.');
    });

    it('should allow to test the query', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockResolvedValue(true);

        const promise = croct.test('user\'s name is "Carol"', {timeout: 5});

        await expect(promise).resolves.toBe(true);

        expect(evaluate).toHaveBeenCalledWith('user\'s name is "Carol"', {timeout: 5});
    });

    it('should test query assuming non-boolean results as false', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockResolvedValue('foo');

        const promise = croct.test('user\'s name is "Carol"', {timeout: 5});

        await expect(promise).resolves.toBe(false);

        expect(evaluate).toHaveBeenCalledWith('user\'s name is "Carol"', {timeout: 5});
    });

    it('should not test query assuming errors as false', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockRejectedValue(undefined);

        const promise = croct.test('user\'s name is "Carol"', {timeout: 5});

        await expect(promise).rejects.toBeUndefined();

        expect(evaluate).toHaveBeenCalledWith('user\'s name is "Carol"', {timeout: 5});
    });

    it('should allow to fetch content', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const content: JsonObject = {
            title: 'Hello World',
        };

        const fetch = jest.spyOn(sdkFacade.contentFetcher, 'fetch').mockResolvedValue({
            content: content,
        });

        const slotId = 'foo';
        const options: FetchOptions = {timeout: 5};

        await expect(croct.fetch(slotId, options)).resolves.toEqual({
            content: content,
        });

        expect(fetch).toHaveBeenLastCalledWith(slotId, options);
    });

    it('should log an error when fetching content fails', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            logger: logger,
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const error = new Error('Reason');

        const fetch = jest.spyOn(sdkFacade.contentFetcher, 'fetch').mockRejectedValue(error);

        const slotId = 'foo';

        await expect(croct.fetch(slotId)).rejects.toBe(error);

        expect(fetch).toHaveBeenCalledWith(slotId, {});

        expect(logger.error).toHaveBeenCalledWith(
            `[Croct] Failed to fetch content for slot "${slotId}@latest": reason`,
        );
    });

    it('should provide the specified fallback content when fetching content fails', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            logger: logger,
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const fetch = jest.spyOn(sdkFacade.contentFetcher, 'fetch').mockRejectedValue(new Error('Reason'));

        const slotId = 'test';

        const fallback = null;

        expect(loadSlotContent).not.toHaveBeenCalled();

        await expect(croct.fetch(slotId, {fallback: fallback})).resolves.toEqual({
            content: fallback,
        });

        expect(fetch).toHaveBeenCalledWith(slotId, {});

        expect(logger.error).toHaveBeenCalledWith(
            `[Croct] Failed to fetch content for slot "${slotId}@latest": reason`,
        );
    });

    it('should provide the default fallback content when fetching content fails', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            logger: logger,
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const fetch = jest.spyOn(sdkFacade.contentFetcher, 'fetch').mockRejectedValue(new Error('Reason'));

        const slotId = 'test';

        const content: JsonObject = {
            title: 'Hello World',
        };

        jest.mocked(loadSlotContent).mockResolvedValue(content);

        await expect(croct.fetch(slotId)).resolves.toEqual({
            content: content,
        });

        expect(fetch).toHaveBeenCalledWith(slotId, {});

        expect(logger.error).toHaveBeenCalledWith(
            `[Croct] Failed to fetch content for slot "${slotId}@latest": reason`,
        );
    });

    it('should provide a localized fallback content when fetching content fails', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            logger: logger,
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const fetch = jest.spyOn(sdkFacade.contentFetcher, 'fetch').mockRejectedValue(new Error('Reason'));

        const slotId = 'test';

        const options: FetchOptions = {preferredLocale: 'es'};

        const content: JsonObject = {
            title: '¡Hola, Mundo!',
        };

        jest.mocked(loadSlotContent).mockResolvedValue(content);

        await expect(croct.fetch(slotId, options)).resolves.toEqual({
            content: content,
        });

        expect(fetch).toHaveBeenCalledWith(slotId, options);

        expect(logger.error).toHaveBeenCalledWith(
            `[Croct] Failed to fetch content for slot "${slotId}@latest": reason`,
        );
    });

    it('should extract the slot ID and version', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const content: JsonObject = {
            title: 'Hello World',
        };

        const fetch = jest.spyOn(sdkFacade.contentFetcher, 'fetch').mockResolvedValue({
            content: content,
        });

        const slotId = 'foo@1';
        const options: FetchOptions = {timeout: 5};

        await expect(croct.fetch(slotId, options)).resolves.toEqual({
            content: content,
        });

        expect(fetch).toHaveBeenLastCalledWith('foo', {
            ...options,
            version: '1',
        });
    });

    it('should fetch content omitting the latest alias', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const content: JsonObject = {
            title: 'Hello World',
        };

        const fetch = jest.spyOn(sdkFacade.contentFetcher, 'fetch').mockResolvedValue({
            content: content,
        });

        const slotId = 'foo@latest';
        const options: FetchOptions = {timeout: 5};

        await expect(croct.fetch(slotId, options)).resolves.toEqual({
            content: content,
        });

        expect(fetch).toHaveBeenLastCalledWith('foo', options);
    });

    it('should fail to fetch a slot content if unplugged', () => {
        expect(() => croct.fetch('foo')).toThrow('Croct is not plugged in.');
    });

    it('should enable the playground plugin by default', () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            logger: logger,
        });

        expect(logger.debug).toHaveBeenCalledWith('[Croct] Plugin "playground" enabled');
    });

    it('should not enable the playground plugin if explicitly disabled', () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            logger: logger,
            plugins: {
                playground: false,
            },
        });

        expect(logger.debug).not.toHaveBeenCalledWith('[Croct] Plugin "playground" enabled');
    });

    it('should enable the preview plugin by default', () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            logger: logger,
        });

        expect(logger.debug).toHaveBeenCalledWith('[Croct] Plugin "preview" enabled');
    });

    it('should not enable the preview plugin if explicitly disabled', () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        croct.plug({
            appId: APP_ID,
            logger: logger,
            plugins: {
                preview: false,
            },
        });

        expect(logger.debug).not.toHaveBeenCalledWith('[Croct] Plugin "preview" enabled');
    });

    it('should wait for the plugins to disable before closing the SDK', async () => {
        let unloadFooPlugin: () => void = jest.fn();
        const fooDisable = jest.fn().mockImplementation(
            () => new Promise<void>(resolve => {
                unloadFooPlugin = resolve;
            }),
        );

        croct.extend(
            'foo',
            () => ({
                enable: jest.fn(),
                disable: fooDisable,
            }),
        );

        const barDisable = jest.fn();

        croct.extend(
            'bar',
            () => ({
                enable: jest.fn(),
                disable: barDisable,
            }),
        );

        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        const close = jest.spyOn(sdkFacade, 'close');

        croct.plug({
            appId: APP_ID,
            plugins: {
                foo: true,
                bar: true,
            },
        });

        const unplugged = jest.fn();
        const promise = croct.unplug().then(unplugged);

        expect(fooDisable).toHaveBeenCalledTimes(1);
        expect(barDisable).toHaveBeenCalledTimes(1);
        expect(close).not.toHaveBeenCalled();

        await new Promise(resolve => {
            setTimeout(resolve, 15);
        });

        expect(unplugged).not.toHaveBeenCalled();

        unloadFooPlugin();

        await promise;

        expect(unplugged).toHaveBeenCalled();
    });

    it('should close the SDK', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toHaveBeenCalledWith(expect.objectContaining(config));

        const close = jest.spyOn(sdkFacade, 'close');

        await croct.unplug();

        expect(close).toHaveBeenCalled();
    });

    it('should close the SDK even if a plugin fail to disable', async () => {
        const plugin: Plugin = {
            enable: jest.fn(),
            disable: jest.fn().mockReturnValue(Promise.reject(new Error('Failure'))),
        };

        croct.extend('foo', () => plugin);

        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        const close = jest.spyOn(sdkFacade, 'close');

        croct.plug({
            appId: APP_ID,
            plugins: {foo: true},
        });

        await expect(croct.unplug()).resolves.toBeUndefined();

        expect(plugin.disable).toHaveBeenCalledTimes(1);

        expect(close).toHaveBeenCalled();
    });
});
