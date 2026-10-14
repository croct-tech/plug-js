import {EventPublisher} from '@croct/sdk/eventPublisher';
import type {PublishRequest} from '@croct/sdk/eventPublisher';
import type {Logger} from '@croct/sdk/logging';
import type {TrackedEvent, TrackOptions} from '../../src/api';
import {track} from '../../src/api';

const mockPublish: EventPublisher['publish'] = jest.fn();

jest.mock(
    '@croct/sdk/eventPublisher',
    () => ({
        __esModule: true,
        /*
         * eslint-disable-next-line prefer-arrow-callback --
         * The mock can't be an arrow function because calling new on
         * an arrow function is not allowed in JavaScript.
         */
        EventPublisher: jest.fn(function constructor(this: EventPublisher) {
            this.publish = mockPublish;
        }),
    }),
);

describe('track', () => {
    const apiKey = '00000000-0000-0000-0000-000000000000';
    const appId = '00000000-0000-0000-0000-000000000000';
    const timestamp = 1700000000000;

    const metadata = {
        clientId: '00000000-0000-0000-0000-000000000001',
        timestamp: timestamp,
        context: {
            tabId: '00000000-0000-0000-0000-000000000002',
            url: 'https://example.com/products/42',
        },
    };

    const event: TrackedEvent<'goalCompleted'> = {
        ...metadata,
        type: 'goalCompleted',
        payload: {
            goalId: 'signup',
            value: 10,
        },
    };

    beforeEach(() => {
        jest.mocked(mockPublish).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should forward a server-side tracking request', async () => {
        const options: TrackOptions = {
            apiKey: apiKey,
            timeout: 100,
            baseEndpointUrl: 'https://croct.example.com',
        };

        await expect(track(event, options)).resolves.toBeUndefined();

        expect(EventPublisher).toHaveBeenCalledWith({
            apiKey: options.apiKey,
            baseEndpointUrl: options.baseEndpointUrl,
        });

        expect(mockPublish).toHaveBeenCalledWith(event, {
            timeout: options.timeout,
        });
    });

    it('should forward a client-side tracking request', async () => {
        const options: TrackOptions = {
            appId: appId,
            extra: {keepalive: true},
        };

        await expect(track(event, options)).resolves.toBeUndefined();

        expect(EventPublisher).toHaveBeenCalledWith({
            appId: options.appId,
        });

        expect(mockPublish).toHaveBeenCalledWith(event, {
            extra: options.extra,
        });
    });

    it('should forward the user token and client details', async () => {
        const trackedEvent: TrackedEvent<'goalCompleted'> = {
            ...event,
            userToken: 'token',
            clientIp: '192.168.0.1',
            clientAgent: 'Mozilla/5.0',
        };

        await track(trackedEvent, {appId: appId});

        expect(mockPublish).toHaveBeenCalledWith(trackedEvent, {});
    });

    it.each<[string, TrackedEvent, PublishRequest]>([
        [
            'sign-in',
            {...metadata, type: 'userSignedIn', payload: {userId: 'c4r0l'}},
            {...metadata, type: 'userSignedIn', payload: {externalUserId: 'c4r0l'}},
        ],
        [
            'sign-out',
            {...metadata, type: 'userSignedOut', payload: {userId: 'c4r0l'}},
            {...metadata, type: 'userSignedOut', payload: {externalUserId: 'c4r0l'}},
        ],
        [
            'sign-up',
            {
                ...metadata,
                type: 'userSignedUp',
                payload: {
                    userId: 'c4r0l',
                    patch: {operations: [{type: 'merge', path: '.', value: {firstName: 'Carol'}}]},
                },
            },
            {
                ...metadata,
                type: 'userSignedUp',
                payload: {
                    externalUserId: 'c4r0l',
                    patch: {operations: [{type: 'merge', path: '.', value: {firstName: 'Carol'}}]},
                },
            },
        ],
    ])('should send the user ID of %s events as the external user ID', async (_, trackedEvent, request) => {
        await track(trackedEvent, {appId: appId});

        expect(mockPublish).toHaveBeenCalledWith(request, {});
    });

    it('should pass the logger to the publisher', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        await track(event, {appId: appId, logger: logger});

        expect(EventPublisher).toHaveBeenCalledWith({
            appId: appId,
            logger: logger,
        });
    });

    it('should log and rethrow errors', async () => {
        const logger: Logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const error = new Error('Reason');

        jest.mocked(mockPublish).mockRejectedValue(error);

        await expect(track(event, {apiKey: apiKey, logger: logger})).rejects.toBe(error);

        expect(logger.error).toHaveBeenCalledWith('Failed to track event "goalCompleted": reason');
    });

    it('should rethrow errors when no logger is provided', async () => {
        const error = new Error('Reason');

        jest.mocked(mockPublish).mockRejectedValue(error);

        await expect(track(event, {apiKey: apiKey})).rejects.toBe(error);
    });
});
