import {JsonObject} from '@croct/json';
import {CanonicalVersionId, Version, Versioned, VersionedId} from './versioning';
import {ComponentContent, ComponentVersionId} from './component';

export interface SlotMap {
}

type LatestSlotVersionMap = {[K in keyof SlotMap]: {latest: SlotMap[K]}};

export interface VersionedSlotMap extends LatestSlotVersionMap {
}

/**
 * Creates an intersection of the given types distributing over unions.
 *
 * The difference between this type and the built-in `&` operator is that the
 * `&` operator creates an intersection of the union members instead of
 * creating a union of the intersection members. For example, given the types
 * `Left = A | B` and `Right = C`, the type `Left & Right` expands to
 * `(A | B) & C`, but `Merge<Left, Right>` expands to `A & C | B & C`,
 * which improves type inference when narrowing the type.
 */
type Intersection<T, E> = T extends infer O ? O & E : never;

type UnionContent = {
    [K in ComponentVersionId]: Intersection<ComponentContent<K>, {_component: K | null}>;
};

type UnknownContent = UnionContent[ComponentVersionId] extends never
    ? (JsonObject & {_component: string | null})
    : UnionContent[ComponentVersionId];

type VersionedContent<I extends VersionedSlotId> = Versioned<I, VersionedSlotMap, UnknownContent>;

export type DynamicSlotId = any;

export type SlotId = keyof VersionedSlotMap extends never ? string : keyof VersionedSlotMap;

export type SlotVersion<I extends SlotId = SlotId> = Version<VersionedSlotMap, I>;

export type SlotVersionId<I extends SlotId = SlotId> = CanonicalVersionId<I, VersionedSlotMap>;

export type VersionedSlotId<I extends SlotId = SlotId> = VersionedId<I, VersionedSlotMap>;

export type CompatibleSlotContent<T extends ComponentVersionId = ComponentVersionId> = UnionContent[T];

export type SlotContent<I extends VersionedSlotId = VersionedSlotId, C extends JsonObject = JsonObject> =
    JsonObject extends C ? (string extends I ? UnknownContent : VersionedContent<I>) : C;
