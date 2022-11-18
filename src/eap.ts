import {VersionedSlotId} from './slot';
import {JsonObject} from './sdk/json';
import {LegacyFetchResponse, Plug} from './plug';

export interface EapFeatures {
    fetch<P extends JsonObject, I extends VersionedSlotId>(this: Plug, slotId: I): Promise<LegacyFetchResponse<I, P>>;
}

interface EapHooks extends EapFeatures{
    initialize(this: Plug): void;
}

declare global {
    interface Window {
        croctEap?: Partial<EapHooks>;
    }
}
