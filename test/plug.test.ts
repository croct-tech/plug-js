import SdkFacade, {Configuration as SdkFacadeConfiguration} from '@croct/sdk/facade/sdkFacade';
import {Logger} from '../src/sdk';
import {Plugin, PluginFactory} from '../src/plugin';
import {GlobalPlug} from '../src/plug';
import {CDN_URL} from '../src/constants';
import {Token} from '../src/sdk/token';

jest.mock('../src/constants', () => {
    return {
        CDN_URL: 'https://cdn.croct.io/js/v1/lib/plug.js',
    };
});

describe('The Croct plug', () => {
    const APP_ID = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';
    const APP_CDN_URL = `${CDN_URL}?appId=${APP_ID}`;

    let croct: GlobalPlug;

    beforeEach(() => {
        croct = new GlobalPlug();
    });

    afterEach(async () => {
        jest.restoreAllMocks();

        await croct.unplug();
    });

    test('should disallow plugin overriding', () => {
        croct.extend('foo', () => ({
            enable: jest.fn(),
        }));

        function override(): void {
            croct.extend('foo', () => ({
                enable: jest.fn(),
            }));
        }

        expect(override).toThrow('Another plugin is already registered with name "foo"');
    });

    test('should fail to initialize if the app ID is not specified and cannot be auto-detected', () => {
        expect(() => croct.plug()).toThrow('The app ID must be specified when it cannot be auto-detected.');
    });

    test('should auto-detect app ID when loaded using an application-specific tag', () => {
        const script: HTMLScriptElement = window.document.createElement('script');
        script.src = APP_CDN_URL;

        window.document.head.appendChild(script);

        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug();

        expect(initialize).toBeCalledWith(config);
    });

    test('should fail if the auto-detected app ID and the specified app ID are conflicting', () => {
        const script: HTMLScriptElement = window.document.createElement('script');
        script.src = APP_CDN_URL;

        window.document.head.appendChild(script);

        function plug(): void {
            croct.plug({appId: '00000000-0000-0000-0000-000000000000'});
        }

        expect(plug).toThrow('The specified app ID and the auto-detected app ID are conflicting.');
    });

    test('should log a warning message when the app ID is specified unnecessarily', () => {
        const script: HTMLScriptElement = window.document.createElement('script');
        script.src = APP_CDN_URL;

        window.document.head.appendChild(script);

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

    test('should initialize the SDK using the specified configuration', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            track: false,
            debug: false,
            tokenScope: 'isolated',
            userId: 'c4r0l',
            eventMetadata: {
                foo: 'bar',
            },
        };

        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
    });

    test('should log failures initializing plugins', () => {
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

        expect(logger.error).toBeCalledWith(
            expect.stringContaining('Failed to initialize plugin "foo": failure'),
        );
    });

    test('should log an error if a plugin is not registered', () => {
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

    test('should log an error if a plugin options is invalid', () => {
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

    test('should not initialize disabled plugins', () => {
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

        expect(logger.warn).toBeCalledWith(
            expect.stringContaining('Plugin "foo" is declared but not enabled'),
        );
    });

    test('should initialize the declared plugins', () => {
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

        expect(initialize).toBeCalledWith(config);

        expect(fooFactory).toBeCalledWith(expect.objectContaining({options: {}}));
        expect(barFactory).toBeCalledWith(expect.objectContaining({options: {flag: true}}));

        expect(getLogger).toBeCalledWith('Plugin', 'foo', 'namespace');
        expect(getTabStorage).toBeCalledWith('Plugin', 'foo', 'namespace');
        expect(getBrowserStorage).toBeCalledWith('Plugin', 'foo', 'namespace');
    });

    test('should handle failures enabling plugins', async () => {
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

    test('should wait for the plugins to initialize', async () => {
        let loadFooPlugin: () => void = jest.fn();

        const fooEnable = jest.fn().mockImplementation(() => new Promise<void>(resolve => {
            loadFooPlugin = resolve;
        }));

        croct.extend('foo', () => ({
            enable: fooEnable,
        }));

        const barEnable = jest.fn();

        croct.extend('bar', () => ({
            enable: barEnable,
        }));

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

        await new Promise(resolve => window.setTimeout(resolve, 15));

        expect(plugged).not.toHaveBeenCalled();

        loadFooPlugin();

        await promise;

        expect(plugged).toHaveBeenCalled();
    });

    test('should not fail if plugged more than once', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);
        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
        expect(initialize).toBeCalledTimes(1);
    });

    test('should provide a callback that is called when the plug is plugged in', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};

        // First time
        const firstCallback = jest.fn();

        const firstPromise = croct.plugged.then(firstCallback);

        await new Promise(resolve => window.setTimeout(resolve, 15));

        expect(firstCallback).not.toHaveBeenCalled();

        croct.plug(config);

        await firstPromise;

        expect(firstCallback).toHaveBeenCalledWith(croct);

        // Second time
        await croct.unplug();

        const secondCallback = jest.fn();

        const secondPromise = croct.plugged.then(secondCallback);

        await new Promise(resolve => window.setTimeout(resolve, 15));

        expect(secondCallback).not.toHaveBeenCalled();

        croct.plug(config);

        await secondPromise;

        expect(secondCallback).toHaveBeenCalledWith(croct);
    });

    test('should provide a callback that is called when the current pending events are flushed', async () => {
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

    test('should provide a tracker facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.tracker).toBe(sdkFacade.tracker);
    });

    test('should not provide a tracker facade if unplugged', () => {
        expect(() => croct.tracker).toThrow('Croct is not plugged in.');
    });

    test('should provide a user facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.user).toBe(sdkFacade.user);
    });

    test('should not provide an evaluator facade if unplugged', () => {
        expect(() => croct.evaluator).toThrow('Croct is not plugged in.');
    });

    test('should provide an evaluator facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.evaluator).toBe(sdkFacade.evaluator);
    });

    test('should not provide a user facade if unplugged', () => {
        expect(() => croct.user).toThrow('Croct is not plugged in.');
    });

    test('should provide a session facade', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.session).toBe(sdkFacade.session);
    });

    test('should not provide a session facade if unplugged', () => {
        expect(() => croct.session).toThrow('Croct is not plugged in.');
    });

    test('should determine whether the user is anonymous', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.isAnonymous()).toBe(sdkFacade.user.isAnonymous());
    });

    test('should fail to determine whether the user is anonymous if unplugged', () => {
        expect(() => croct.isAnonymous()).toThrow('Croct is not plugged in.');
    });

    test('should provide the user ID', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            userId: '3r1ck',
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.getUserId()).toBe(config.userId);
    });

    test('should fail to provide the user ID if unplugged', () => {
        expect(() => croct.getUserId()).toThrow('Croct is not plugged in.');
    });

    test('should allow to identify the user', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        croct.identify('3r1ck');

        expect(croct.getUserId()).toBe('3r1ck');
    });

    test('should not allow to identify the user if unplugged', () => {
        expect(() => croct.identify('3r1ck')).toThrow('Croct is not plugged in.');
    });

    test('should allow to anonymize the user', () => {
        const config: SdkFacadeConfiguration = {
            appId: APP_ID,
            userId: '3r1ck',
        };

        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.isAnonymous()).toBeFalsy();

        croct.anonymize();

        expect(croct.isAnonymous()).toBeTruthy();
    });

    test('should not allow to anonymize the user if unplugged', () => {
        expect(() => croct.anonymize()).toThrow('Croct is not plugged in.');
    });

    test('should allow to set a user token', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const setToken = jest.spyOn(sdkFacade, 'setToken');

        const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNGIz'
            + 'LTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N'
            + '0LmlvIiwiaWF0IjowLCJzdWIiOiJjNHIwbCJ9.';

        croct.setToken(token);

        expect(setToken).toBeCalledWith(Token.parse(token));
    });

    test('should not allow to set a user token if unplugged', () => {
        expect(() => croct.setToken('')).toThrow('Croct is not plugged in.');
    });

    test('should allow to unset a user token', () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const unsetToken = jest.spyOn(sdkFacade, 'unsetToken');

        croct.unsetToken();

        expect(unsetToken).toBeCalled();
    });

    test('should not allow to unset a user token if unplugged', () => {
        expect(() => croct.unsetToken()).toThrow('Croct is not plugged in.');
    });

    test('should allow to track events', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const track = jest.spyOn(sdkFacade.tracker, 'track').mockResolvedValue({
            type: 'userSignedUp',
            userId: 'c4r0l',
        });

        await croct.track('userSignedUp', {userId: 'c4r0l'});

        expect(track).toBeCalledWith('userSignedUp', {userId: 'c4r0l'});
    });

    test('should not allow to track events if unplugged', () => {
        expect(() => croct.track('userSignedUp', {userId: 'c4r0l'})).toThrow('Croct is not plugged in.');
    });

    test('should allow to evaluate expressions', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockResolvedValue('carol');

        const promise = croct.evaluate('user\'s name', {timeout: 5});

        await expect(promise).resolves.toBe('carol');

        expect(evaluate).toBeCalledWith('user\'s name', {timeout: 5});
    });

    test('should not allow to evaluate expressions if unplugged', () => {
        expect(() => croct.evaluate('foo', {timeout: 5})).toThrow('Croct is not plugged in.');
    });

    test('should allow to test expressions', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockResolvedValue(true);

        const promise = croct.test('user\'s name is "Carol"', {timeout: 5});

        await expect(promise).resolves.toBe(true);

        expect(evaluate).toBeCalledWith('user\'s name is "Carol"', {timeout: 5});
    });

    test('should test expressions assuming non-boolean results as false', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockResolvedValue('foo');

        const promise = croct.test('user\'s name is "Carol"', {timeout: 5});

        await expect(promise).resolves.toBe(false);

        expect(evaluate).toBeCalledWith('user\'s name is "Carol"', {timeout: 5});
    });

    test('should not test expressions assuming errors as false', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const evaluate = jest.spyOn(sdkFacade.evaluator, 'evaluate').mockRejectedValue(undefined);

        const promise = croct.test('user\'s name is "Carol"', {timeout: 5});

        await expect(promise).rejects.toBeUndefined();

        expect(evaluate).toBeCalledWith('user\'s name is "Carol"', {timeout: 5});
    });

    test('should enable the playground plugin by default', () => {
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

    test('should not enable the playground plugin if explicitly disabled', () => {
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

    test('should wait for the plugins to disable before closing the SDK', async () => {
        let unloadFooPlugin: () => void = jest.fn();
        const fooDisable = jest.fn().mockImplementation(() => new Promise<void>(resolve => {
            unloadFooPlugin = resolve;
        }));

        croct.extend('foo', () => ({
            enable: jest.fn(),
            disable: fooDisable,
        }));

        const barDisable = jest.fn();

        croct.extend('bar', () => ({
            enable: jest.fn(),
            disable: barDisable,
        }));

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

        await new Promise(resolve => window.setTimeout(resolve, 15));

        expect(unplugged).not.toHaveBeenCalled();

        unloadFooPlugin();

        await promise;

        expect(unplugged).toHaveBeenCalled();
    });

    test('should close the SDK', async () => {
        const config: SdkFacadeConfiguration = {appId: APP_ID};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const close = jest.spyOn(sdkFacade, 'close');

        await croct.unplug();

        expect(close).toBeCalled();
    });

    test('should close the SDK even if a plugin fail to disable', async () => {
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
