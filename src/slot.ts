import {JsonObject} from '@croct/json';

export interface SlotMap {
}

type LatestSlotVersionMap = {[K in keyof SlotMap]: {latest: SlotMap[K]}};

export interface VersionedSlotMap extends LatestSlotVersionMap {
}

type LatestAlias = 'latest';

export type SlotId = keyof VersionedSlotMap extends never ? string : keyof VersionedSlotMap;

export type SlotVersion<I extends SlotId = SlotId> = LatestAlias | (
    I extends keyof VersionedSlotMap
        ? keyof VersionedSlotMap[I]
        : never
);

export type VersionedSlotId<I extends SlotId = SlotId> = I | {[K in SlotId]: `${K}@${SlotVersion<K> & string}`}[I];

type VersionedSlotContent<I extends SlotId, V extends string = LatestAlias, C extends JsonObject = JsonObject> =
    I extends keyof VersionedSlotMap
        ? (V extends keyof VersionedSlotMap[I]
            ? VersionedSlotMap[I][V]
            : C)
        : C;

export type ExtractSlotVersion<I extends string> = I extends `${string}@${infer V}`
    ? (LatestAlias extends V ? LatestAlias : (V extends `${number}` ? V : never))
    : LatestAlias;

export type ExtractSlotId<I extends string> = I extends `${infer V}@${string}` ? V : I;

export type SlotContent<I extends VersionedSlotId, C extends JsonObject = JsonObject> =
    VersionedSlotContent<ExtractSlotId<I>, ExtractSlotVersion<I>, C>;
