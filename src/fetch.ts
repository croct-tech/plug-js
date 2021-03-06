import {NullableJsonObject} from './sdk/json';

export interface SlotMap {
}

export type SlotId = keyof SlotMap extends never ? string : keyof SlotMap;

export type SlotContent<I extends SlotId> = I extends keyof SlotMap ? SlotMap[I] : NullableJsonObject;

export type FetchResponse<I extends SlotId, P extends NullableJsonObject = NullableJsonObject> = {
    payload: SlotContent<I> & P,
};
