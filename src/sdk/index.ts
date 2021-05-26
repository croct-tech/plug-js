import {EventListener, EventDispatcher, EventSubscriber, EventManager} from '@croct/sdk/eventManager';
import {SdkEventMap, SdkEventType} from '@croct/sdk/sdkEvents';

export {Logger} from '@croct/sdk/logging';
export {SessionFacade} from '@croct/sdk/facade/sessionFacade';
export {UserFacade} from '@croct/sdk/facade/userFacade';
export {Tab} from '@croct/sdk/tab';
export {CidAssigner} from '@croct/sdk/cid';
export {SdkEventType, SdkEvent} from '@croct/sdk/sdkEvents';

export type SdkEventListener<T extends SdkEventType> = EventListener<SdkEventMap[T]>;
export type SdkEventDispatcher = EventDispatcher<Record<string, Record<string, any>>>;
export type SdkEventSubscriber = EventSubscriber<SdkEventMap>;
export type SdkEventManager = EventManager<SdkEventMap, Record<string, Record<string, any>>>;
