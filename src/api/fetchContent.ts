import {
    ContentFetcher,
    DynamicContentOptions as BaseDynamicOptions,
    StaticContentOptions as BaseStaticOptions,
} from '@croct/sdk/contentFetcher';
import {JsonObject, JsonValue} from '../sdk/json';
import {FetchResponse} from '../plug';
import {SlotContent, VersionedSlotId} from '../slot';

type FetchingOptions<T extends JsonValue> = {
    baseEndpointUrl?: string,
    fallback?: T,
};

type AuthOptions = ServerSideAuthOptions | ClientSideAuthOptions;

type ServerSideAuthOptions = {
    apiKey: string,
    appId?: never,
};

type ClientSideAuthOptions = {
    appId: string,
    apiKey?: never,
};

export type DynamicContentOptions<T extends JsonObject = JsonObject> =
    Omit<BaseDynamicOptions, 'version'> & FetchingOptions<T> & AuthOptions;

export type StaticContentOptions<T extends JsonObject = JsonObject> =
    Omit<BaseStaticOptions, 'version'> & FetchingOptions<T> & ServerSideAuthOptions;

export type FetchOptions<T extends JsonObject = SlotContent> = DynamicContentOptions<T> | StaticContentOptions<T>;

export function fetchContent<I extends VersionedSlotId, C extends JsonObject>(
    slotId: I,
    options?: FetchOptions<SlotContent<I, C>>,
): Promise<Omit<FetchResponse<I, C>, 'payload'>> {
    const {apiKey, appId, fallback, baseEndpointUrl, ...fetchOptions} = options ?? {};
    const auth = {appId: appId, apiKey: apiKey};
    const [id, version = 'latest'] = slotId.split('@') as [I, `${number}` | 'latest' | undefined];

    const promise = (new ContentFetcher({...auth, baseEndpointUrl: baseEndpointUrl}))
        .fetch<SlotContent<I, C>>(
            id,
            version === 'latest'
                ? fetchOptions
                : {...fetchOptions, version: version},
        );

    if (fallback !== undefined) {
        return promise.catch(
            () => ({
                content: fallback,
            }),
        );
    }

    return promise;
}
