import type {EventData, EventType, PublishOptions, PublishRequest} from '@croct/sdk/eventPublisher';
import {EventPublisher} from '@croct/sdk/eventPublisher';
import type {ApiKey} from '@croct/sdk/apiKey';
import type {Logger} from '@croct/sdk/logging';
import {formatCause} from '@croct/sdk/error';

/**
 * The payload as exposed to callers, which may use different names than the API.
 */
type PublicPayload<P> = P extends {externalUserId: infer U}
    ? Omit<P, 'externalUserId'> & {userId: U}
    : P;

export type TrackedEvent<T extends EventType = EventType> = {
    // Distributes over the event types so that the type and payload of each event stay correlated
    [K in T]: {
        type: K,
        payload: PublicPayload<EventData<K>['payload']>,
    }
}[T] & Omit<PublishRequest, 'type' | 'payload'>;

type AuthOptions = ServerSideAuthOptions | ClientSideAuthOptions;

type ServerSideAuthOptions = {
    apiKey: string | ApiKey,
    appId?: never,
};

type ClientSideAuthOptions = {
    appId: string,
    apiKey?: never,
};

export type TrackOptions = PublishOptions & AuthOptions & {
    baseEndpointUrl?: string,
    logger?: Logger,
};

export function track<T extends EventType>(event: TrackedEvent<T>, options: TrackOptions): Promise<void>;

export function track(event: TrackedEvent, options: TrackOptions): Promise<void> {
    const {apiKey, appId, baseEndpointUrl, logger, ...publishOptions} = options;
    const auth: AuthOptions = apiKey !== undefined ? {apiKey: apiKey} : {appId: appId};

    const publisher = new EventPublisher({
        ...auth,
        ...(baseEndpointUrl !== undefined ? {baseEndpointUrl: baseEndpointUrl} : {}),
    });

    return publisher.publish(createRequest(event), publishOptions)
        .catch(error => {
            if (logger !== undefined) {
                logger.error(`Failed to track event "${event.type}": ${formatCause(error)}`);
            }

            throw error;
        });
}

function createRequest(event: TrackedEvent): PublishRequest {
    switch (event.type) {
        case 'userSignedIn':
        case 'userSignedOut':
        case 'userSignedUp': {
            const {payload: {userId, ...payload}, ...request} = event;

            return {
                ...request,
                payload: {
                    ...payload,
                    externalUserId: userId,
                },
            };
        }

        default:
            return event;
    }
}
