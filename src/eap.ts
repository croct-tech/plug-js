import {SlotId, FetchResponse} from './fetch';
import {NullableJsonObject} from './sdk/json';

export interface EapFeatures {
    fetch<P extends NullableJsonObject, I extends SlotId = SlotId>(slotId: I): Promise<FetchResponse<I, P>>;
}

declare global {
    interface Window {
        croctEap?: Partial<EapFeatures>;
    }
}
