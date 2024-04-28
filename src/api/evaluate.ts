import {Evaluator, EvaluationOptions as BaseOptions} from '@croct/sdk/evaluator';
import {JsonValue} from '../sdk/json';

export type EvaluationOptions<T extends JsonValue = JsonValue> = BaseOptions & AuthOptions & FetchingOptions<T>;

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

export function evaluate<T extends JsonValue>(query: string, options: EvaluationOptions<T>): Promise<T> {
    const {baseEndpointUrl, fallback, apiKey, appId, ...evaluation} = options;
    const auth: AuthOptions = apiKey !== undefined ? {apiKey: apiKey} : {appId: appId};
    const promise = (new Evaluator({...auth, baseEndpointUrl: baseEndpointUrl}))
        .evaluate(query, evaluation) as Promise<T>;

    if (fallback !== undefined) {
        return promise.catch(() => fallback);
    }

    return promise;
}
