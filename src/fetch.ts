import {JsonObject} from '@croct/json';

export interface SlotMap {
}

export type SlotId = keyof SlotMap extends never ? string : keyof SlotMap;

export type SlotContent<I extends SlotId> = I extends keyof SlotMap ? SlotMap[I] : JsonObject;

export type FetchResponse<I extends SlotId, P extends JsonObject = JsonObject> = {
    payload: SlotContent<I> & P,
};
