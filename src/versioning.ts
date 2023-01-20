import {JsonObject} from '@croct/json';

export type LatestAlias = 'latest';

export type ExtractVersion<I extends string> = I extends `${string}@${infer V}`
    ? (LatestAlias extends V ? LatestAlias : (V extends `${number}` ? V : never))
    : LatestAlias;

export type CanonicalVersionId<I extends string, M> = {
    [K in I]: `${K}@${Extract<Version<M, K>, `${number}`>}`
}[I];

/**
 * Utility type that coerces any type to a string if it is not a string literal.
 */
type CastString<T extends string> = T extends `${infer V}` ? V : string;

export type VersionedId<I extends string, M> = CastString<I> | {[K in I]: `${K}@${Version<M, K> & string}`}[I];

export type ExtractId<I extends string> = I extends `${infer V}@${string}` ? V : CastString<I>;

export type Version<M, I extends string> = LatestAlias | (I extends keyof M ? keyof M[I] : never);

export type Versioned<I extends string, M, C extends JsonObject = JsonObject> =
    ExtractId<I> extends keyof M
        ? ExtractVersion<I> extends keyof M[ExtractId<I>]
            ? M[ExtractId<I>][ExtractVersion<I>]
            : C
        : C;
