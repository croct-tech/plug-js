import {
    ContentFetcher,
    DynamicContentOptions as BaseDynamicOptions,
    StaticContentOptions as BaseStaticOptions,
} from '@croct/sdk/contentFetcher';
import type {ApiKey} from '@croct/sdk/apiKey';
import type {Logger} from '@croct/sdk/logging';
import {formatCause} from '@croct/sdk/error';
import {loadSlotContent} from '@croct/content';
import {JsonObject, JsonValue} from '../sdk/json';
import {FetchResponse} from '../plug';
import {SlotContent, VersionedSlotId} from '../slot';

export type {FetchResponse} from '../plug';

type FetchingOptions<T extends JsonValue> = {
    baseEndpointUrl?: string,
    fallback?: T,
    logger?: Logger,
};

type AuthOptions = ServerSideAuthOptions | ClientSideAuthOptions;

type ServerSideAuthOptions = {
    apiKey: string|ApiKey,
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
    const {
        apiKey,
        appId,
        fallback,
        baseEndpointUrl,
        logger,
        preferredLocale = '',
        ...fetchOptions
    } = options ?? {};

    const auth = {appId: appId, apiKey: apiKey};
    const [id, version = 'latest'] = slotId.split('@') as [I, `${number}` | 'latest' | undefined];
    const normalizedLocale = preferredLocale === '' ? undefined : preferredLocale;

    const promise = (new ContentFetcher({...auth, baseEndpointUrl: baseEndpointUrl}))
        .fetch<SlotContent<I, C>>(id, {
            ...fetchOptions,
            ...(normalizedLocale !== undefined ? {preferredLocale: normalizedLocale} : {}),
            ...(version !== 'latest' ? {version: version} : {}),
        });

    return promise.catch(
        async error => {
            if (logger !== undefined) {
                logger.error(`Failed to fetch content for slot "${id}@${version}": ${formatCause(error)}`);
            }

            if (fallback !== undefined) {
                return {content: fallback};
            }

            const staticContent = await loadSlotContent(id, normalizedLocale);

            if (staticContent === null) {
                throw error;
            }

            return {content: staticContent as SlotContent<I, C>};
        },
    );
}
