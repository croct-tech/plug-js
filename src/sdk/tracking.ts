import type {EventInfo as SdkEventInfo} from '@croct/sdk/tracker';
import type {TrackingEvent, TrackingEventType} from '@croct/sdk/trackingEvents';

export {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
export type {EventListener} from '@croct/sdk/tracker';
export type {
    TrackingEvent,
    TrackingEventType,
    ExternalTrackingEvent,
    ExternalTrackingEventPayload,
    ExternalTrackingEventType,
} from '@croct/sdk/trackingEvents';

export type EventInfo<T extends TrackingEventType> = SdkEventInfo<TrackingEvent<T>>;
