import {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
import {Plugin, PluginFactory} from '../../plugin';
import {SdkEventSubscriber} from '../../sdk';

export type Configuration = {
    eventSubscriber: SdkEventSubscriber,
    tracker: TrackerFacade,
};

export class AutoTrackingPlugin implements Plugin {
    private readonly eventSubscriber: SdkEventSubscriber;

    private readonly tracker: TrackerFacade;

    public constructor(configuration: Configuration) {
        this.eventSubscriber = configuration.eventSubscriber;
        this.tracker = configuration.tracker;
    }

    public enable(): Promise<void> | void {

    }

    public disable(): Promise<void> | void {

    }
}

export type Options = {
    disabled?: {
    },
};

export const factory: PluginFactory<Options> = (props): AutoTrackingPlugin => new AutoTrackingPlugin({
    eventSubscriber: props.sdk.eventManager,
    tracker: props.sdk.tracker,
});
