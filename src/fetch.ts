import {JsonObject} from './sdk/json';

export interface ContentMap {
}

export type ContentId = keyof ContentMap extends never ? string : keyof ContentMap;

export type ContentPayload<I extends ContentId> = I extends keyof ContentMap ? ContentMap[I] : JsonObject;

export type FetchResponse<I extends ContentId, P extends JsonObject = JsonObject> = {
    payload: ContentPayload<I> & P,
};
