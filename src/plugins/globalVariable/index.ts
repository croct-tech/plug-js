import type {Plugin, PluginFactory} from '../../plugin';
import type {Plug} from '../../plug';

export type Configuration = {
    plug: Plug,
};

export class GlobalVariablePlugin implements Plugin {
    private readonly plug: Plug;

    private globallyAvailable = true;

    public constructor(configuration: Configuration) {
        this.plug = configuration.plug;
    }

    public enable(): void {
        if (window.croct === undefined) {
            window.croct = this.plug;
            this.globallyAvailable = false;
        }

        let callback = window.onCroctLoad;

        Object.defineProperty(window, 'onCroctLoad', {
            configurable: true,
            get: () => callback,
            set: listener => {
                this.notify(listener);
                callback = listener;
            },
        });

        this.notify(callback);
    }

    public disable(): void {
        if (!this.globallyAvailable) {
            delete window.croct;
        }

        const callback = window.onCroctLoad;

        // Restore original property descriptor
        delete window.onCroctLoad;

        window.onCroctLoad = callback;
    }

    private notify(callback: CroctCallback | undefined): void {
        if (typeof callback === 'function') {
            callback(this.plug);
        }
    }
}

export const factory = (
    (props): GlobalVariablePlugin => new GlobalVariablePlugin({plug: props.sdk.plug})
) satisfies PluginFactory;
