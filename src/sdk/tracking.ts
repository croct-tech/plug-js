import {EventInfo as SdkEventInfo} from '@croct/sdk/tracker';
import {TrackingEvent, TrackingEventType} from '@croct/sdk/trackingEvents';

export {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
export {EventListener} from '@croct/sdk/tracker';
export {
    TrackingEvent,
    TrackingEventType,
    ExternalTrackingEvent,
    ExternalTrackingEventPayload,
    ExternalTrackingEventType,
} from '@croct/sdk/trackingEvents';

export type EventInfo<T extends TrackingEventType> = SdkEventInfo<TrackingEvent<T>>;
