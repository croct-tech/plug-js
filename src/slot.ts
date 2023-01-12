import {JsonObject} from '@croct/json';
import {CanonicalVersionId, Version, Versioned, VersionedId} from './versioning';
import {ComponentContent, ComponentVersionId} from './component';

export interface SlotMap {
}

type LatestSlotVersionMap = {[K in keyof SlotMap]: {latest: SlotMap[K]}};

export interface VersionedSlotMap extends LatestSlotVersionMap {
}

export type SlotId = keyof VersionedSlotMap extends never ? string : keyof VersionedSlotMap;

export type SlotVersion<I extends SlotId = SlotId> = Version<VersionedSlotMap, I>;

export type SlotVersionId<I extends SlotId = SlotId> = CanonicalVersionId<I, VersionedSlotMap>;

export type VersionedSlotId<I extends SlotId = SlotId> = VersionedId<I, VersionedSlotMap>;

export type DynamicSlotId = any;

type DiscriminatedContent<T = Record<never, never>, I extends string|null = null> = T & {_component: I};

type DiscriminatedComponentMap = {
    [K in ComponentVersionId]: DiscriminatedContent<ComponentContent<K>, K>;
};

export type CompatibleSlotContent<T extends ComponentVersionId = ComponentVersionId> =
    DiscriminatedComponentMap[T];

type UnionContent = {[I in ComponentVersionId]: DiscriminatedComponentMap[I]}[ComponentVersionId];

type UnknownContent = UnionContent extends never ? JsonObject : UnionContent | DiscriminatedContent;

export type SlotContent<I extends VersionedSlotId = VersionedSlotId, C extends JsonObject = JsonObject> =
    JsonObject extends C
        ? string extends I
            ? UnknownContent
            : DiscriminatedContent<Versioned<I, VersionedSlotMap, UnknownContent>, string>
        : C;
