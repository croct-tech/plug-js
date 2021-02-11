import {JsonObject} from '@croct/sdk/json';
import {ContentId, FetchResponse} from './fetch';

export interface EapFeatures {
    fetch?<P extends JsonObject, I extends ContentId = ContentId>(contentId: I): Promise<FetchResponse<I, P>>;
}

declare global {
    interface Window {
        croctEap?: EapFeatures;
    }
}
