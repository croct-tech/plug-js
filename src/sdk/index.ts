import {EventListener, EventDispatcher, EventSubscriber, EventManager} from '@croct/sdk/eventManager';
import {SdkEventMap, SdkEventType} from '@croct/sdk/sdkEvents';

export {Logger} from '@croct/sdk/logging';
export {default as SessionFacade} from '@croct/sdk/facade/sessionFacade';
export {default as UserFacade} from '@croct/sdk/facade/userFacade';
export {default as Tab} from '@croct/sdk/tab';
export {default as CidAssigner} from '@croct/sdk/cid';
export {SdkEventType, SdkEvent} from '@croct/sdk/sdkEvents';

export type SdkEventListener<T extends SdkEventType> = EventListener<SdkEventMap[T]>;
export type SdkEventDispatcher = EventDispatcher<Record<string, object>>;
export type SdkEventSubscriber = EventSubscriber<SdkEventMap>;
export type SdkEventManager = EventManager<SdkEventMap, Record<string, object>>;
