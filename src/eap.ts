import {SlotId, FetchResponse} from './fetch';
import {NullableJsonObject} from './sdk/json';
import {Plug} from './plug';

export interface EapFeatures {
    fetch<P extends NullableJsonObject, I extends SlotId = SlotId>(this: Plug, slotId: I): Promise<FetchResponse<I, P>>;
}

interface EapHooks extends EapFeatures{
    initialize(this: Plug): void;
}

declare global {
    interface Window {
        croctEap?: Partial<EapHooks>;
    }
}
