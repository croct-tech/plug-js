import type {JsonObject} from '@croct/json';

export type LatestAlias = 'latest';

export type CanonicalVersionId<I extends string, M> = {
    [K in I]: `${K}@${Extract<Version<M, K>, `${number}`>}`
}[I];

/**
 * Utility type that coerces any type to a string if it is not a string literal.
 */
type CastString<T extends string> = T extends `${infer V}` ? V : string;

export type VersionedId<I extends string, M> = CastString<I> | {[K in I]: `${K}@${Version<M, K> & string}`}[I];

export type Version<M, I extends string> = LatestAlias | (I extends keyof M ? keyof M[I] : never);

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type Expand<T> = {[K in keyof T]: T[K]};

type FlattenVersionMap<T> = Expand<
    UnionToIntersection<
        {
            [K in Extract<keyof T, string>]: {
                [K2 in Extract<keyof T[K], string> as (`${K}@${K2}` | (LatestAlias extends K2 ? K : never))]: T[K][K2];
            }
        }[Extract<keyof T, string>]
    >
>;

export type Versioned<I extends string, M, C extends JsonObject = JsonObject> =
    // Ensure T is string
    I extends `${infer K}`
        ? K extends keyof FlattenVersionMap<M>
            ? FlattenVersionMap<M>[K]
            : C
        : C;
