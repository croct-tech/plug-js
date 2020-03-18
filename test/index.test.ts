import {SdkFacade, SdkFacadeConfiguration} from "@croct-tech/sdk";
import croct from "../src/index";

describe('A Croct plug', () => {
    const appId = '7e9d59a9-e4b3-45d4-b1c7-48287f1e5e8a';

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should initialize the SDK using the specified configuration', () => {
        const initialize = jest.spyOn(SdkFacade, 'initialize');
        const config: SdkFacadeConfiguration = {
            appId: appId,
            track: false,
            debug: false,
            tokenScope: 'isolated',
            userId: 'c4r0l',
        };

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
    });

    test('should fail if it is not plugged in', () => {
        function initialize(): void {
            croct.isAnonymous();
        }

        expect(initialize).toThrow(Error);
        expect(initialize).toThrow('Croct is not plugged in.');
    });

    test('should provide a tracker facade', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
        expect(croct.tracker).toBe(sdkFacade.tracker);
    });

    test('should provide a user facade', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
        expect(croct.user).toBe(sdkFacade.user);
    });

    test('should provide a session facade', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
        expect(croct.session).toBe(sdkFacade.session);
    });

    test('should determine whether the user is anonymous', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);

        croct.plug(config);

        expect(initialize).toBeCalledWith(config);
        expect(croct.isAnonymous()).toBe(sdkFacade.user.isAnonymous());
    });

    test('should allow to set a user token', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);
        const setToken = jest.spyOn(sdkFacade, 'setToken');

        croct.plug(config);

        const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIiwiYXBwSWQiOiI3ZTlkNTlhOS1lNGIz' +
            'LTQ1ZDQtYjFjNy00ODI4N2YxZTVlOGEifQ.eyJpc3MiOiJjcm9jdC5pbyIsImF1ZCI6ImNyb2N' +
            '0LmlvIiwiaWF0IjowLCJzdWIiOiJjNHIwbCJ9.';

        croct.setToken(token);

        expect(initialize).toBeCalledWith(config);
        expect(setToken).toBeCalledWith(token);
    });

    test('should allow to unset a user token', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);
        const unsetToken = jest.spyOn(sdkFacade, 'unsetToken');

        croct.plug(config);
        croct.unsetToken();

        expect(initialize).toBeCalledWith(config);
        expect(unsetToken).toBeCalled();
    });

    test('should allow to track events', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);
        const track = jest.spyOn(sdkFacade, 'track');

        croct.plug(config);
        croct.track('userSignedUp', {userId: 'c4r0l'});

        expect(initialize).toBeCalledWith(config);
        expect(track).toBeCalledWith('userSignedUp', {userId: 'c4r0l'});
    });

    test('should allow to evaluate expressions', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);
        const evaluate = jest.spyOn(sdkFacade, 'evaluate');

        croct.plug(config);
        croct.evaluate('user\'s name', {timeout: 5});

        expect(initialize).toBeCalledWith(config);
        expect(evaluate).toBeCalledWith('user\'s name', {timeout: 5});
    });

    test('should close the SDK', () => {
        const config = {appId: appId};
        const sdkFacade = SdkFacade.initialize(config);

        const initialize = jest.spyOn(SdkFacade, 'initialize').mockReturnValue(sdkFacade);
        const close = jest.spyOn(sdkFacade, 'close');

        croct.plug(config);
        croct.unplug();

        expect(initialize).toBeCalledWith(config);
        expect(close).toBeCalled();
    });
});
