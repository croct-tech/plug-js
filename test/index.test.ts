import {SdkFacade, SdkFacadeConfiguration} from '@croct-tech/sdk';
import croct from '../src/index';

describe('The Croct plug', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';

    afterEach(async () => {
        jest.restoreAllMocks();

        await croct.unplug();
    });

    test('should initialize the SDK using the specified configuration', () => {
        const config: SdkFacadeConfiguration = {
            appId: appId,
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

        expect(croct.sdk).toBe(sdkFacade);
    });

    test('should not fail if plugged more than once', () => {
        const config: SdkFacadeConfiguration = {appId: appId};
        const sdkFacade = SdkFacade.init(config);
        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);
        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
        expect(initialize).toBeCalledTimes(1);
    });

    test('should provide a callback that is called when the current pending events are flushed', async () => {
        const config: SdkFacadeConfiguration = {appId: appId};

        const sdkFacade = SdkFacade.init(config);

        const flushed = jest.fn().mockResolvedValue(undefined);

        Object.defineProperty(sdkFacade.tracker, 'flushed', {
            get: flushed,
        });

        jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        await expect(croct.flushed).resolves.toBeUndefined();

        expect(flushed).toHaveBeenCalledTimes(1);
    });

    test('should provide a tracker facade', () => {
        const config: SdkFacadeConfiguration = {appId: appId};
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
        const config: SdkFacadeConfiguration = {appId: appId};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        expect(croct.user).toBe(sdkFacade.user);
    });

    test('should not provide a user facade if unplugged', () => {
        expect(() => croct.user).toThrow('Croct is not plugged in.');
    });

    test('should provide a session facade', () => {
        const config: SdkFacadeConfiguration = {appId: appId};
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
        const config: SdkFacadeConfiguration = {appId: appId};
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
            appId: appId,
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
        const config: SdkFacadeConfiguration = {appId: appId};

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
            appId: appId,
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
        const config: SdkFacadeConfiguration = {appId: appId};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const setToken = jest.spyOn(sdkFacade, 'setToken');

        const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNGIz'
            + 'LTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N'
            + '0LmlvIiwiaWF0IjowLCJzdWIiOiJjNHIwbCJ9.';

        croct.setToken(token);

        expect(setToken).toBeCalledWith(token);
    });

    test('should not allow to set a user token if unplugged', () => {
        expect(() => croct.setToken('')).toThrow('Croct is not plugged in.');
    });

    test('should allow to unset a user token', () => {
        const config: SdkFacadeConfiguration = {appId: appId};
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
        const config: SdkFacadeConfiguration = {appId: appId};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const track = jest.spyOn(sdkFacade, 'track').mockResolvedValue({
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
        const config: SdkFacadeConfiguration = {appId: appId};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const evaluate = jest.spyOn(sdkFacade, 'evaluate').mockResolvedValue('carol');

        const promise = croct.evaluate('user\'s name', {timeout: 5});

        await expect(promise).resolves.toBe('carol');

        expect(evaluate).toBeCalledWith('user\'s name', {timeout: 5});
    });

    test('should not allow to evaluate expressions if unplugged', () => {
        expect(() => croct.evaluate('foo', {timeout: 5})).toThrow('Croct is not plugged in.');
    });

    test('should close the SDK', async () => {
        const config: SdkFacadeConfiguration = {appId: appId};
        const sdkFacade = SdkFacade.init(config);

        const initialize = jest.spyOn(SdkFacade, 'init').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);

        const close = jest.spyOn(sdkFacade, 'close');

        await croct.unplug();

        expect(close).toBeCalled();
    });
});
