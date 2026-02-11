import type {EvaluationOptions as BaseOptions} from '@croct/sdk/evaluator';
import {Evaluator} from '@croct/sdk/evaluator';
import type {ApiKey} from '@croct/sdk/apiKey';
import type {Logger} from '@croct/sdk/logging';
import {formatCause} from '@croct/sdk/error';
import type {JsonValue} from '../sdk/json';

export type EvaluationOptions<T extends JsonValue = JsonValue> = BaseOptions & AuthOptions & FetchingOptions<T>;

type FetchingOptions<T extends JsonValue> = {
    baseEndpointUrl?: string,
    fallback?: T,
    logger?: Logger,
};

type AuthOptions = ServerSideAuthOptions | ClientSideAuthOptions;

type ServerSideAuthOptions = {
    apiKey: string | ApiKey,
    appId?: never,
};

type ClientSideAuthOptions = {
    appId: string,
    apiKey?: never,
};

export function evaluate<T extends JsonValue>(query: string, options: EvaluationOptions<T>): Promise<T> {
    const {baseEndpointUrl, fallback, apiKey, appId, logger, ...evaluation} = options;
    const auth: AuthOptions = apiKey !== undefined ? {apiKey: apiKey} : {appId: appId};
    const promise = (new Evaluator({...auth, baseEndpointUrl: baseEndpointUrl}))
        .evaluate(query, evaluation) as Promise<T>;

    if (fallback !== undefined) {
        return promise.catch(
            error => {
                if (logger !== undefined) {
                    const reference = query.length > 20
                        ? `${query.slice(0, 20)}...`
                        : query;

                    logger.error(`Failed to evaluate query "${reference}": ${formatCause(error)}`);
                }

                return fallback;
            },
        );
    }

    return promise;
}
