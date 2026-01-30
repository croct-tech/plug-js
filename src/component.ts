import type {CanonicalVersionId, Version, Versioned, VersionedId} from './versioning';

export interface ComponentMap {
}

type LatestComponentVersionMap = {[K in keyof ComponentMap]: {latest: ComponentMap[K]}};

export interface VersionedComponentMap extends LatestComponentVersionMap {
}

export type ComponentId = keyof VersionedComponentMap extends never ? string : keyof VersionedComponentMap;

export type ComponentVersion<I extends ComponentId> = Version<VersionedComponentMap, I>;

export type ComponentVersionId<I extends ComponentId = ComponentId> = CanonicalVersionId<I, VersionedComponentMap>;

export type VersionedComponentId<I extends ComponentId = ComponentId> = VersionedId<I, VersionedComponentMap>;

export type ComponentContent<I extends VersionedComponentId> = Versioned<I, VersionedComponentMap>;
