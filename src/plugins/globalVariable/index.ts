import {Plugin, PluginFactory} from '../../plugin';
import {Plug} from '../../plug';

export type Configuration = {
    plug: Plug,
};

export class GlobalVariablePlugin implements Plugin {
    private readonly plug: Plug;

    public constructor(configuration: Configuration) {
        this.plug = configuration.plug;
    }

    public enable(): void {
        window.croct = this.plug;

        if (window.croctListener !== undefined) {
            this.notifyListeners(window.croctListener);
        }

        Object.defineProperty(window, 'croctListener', {
            configurable: true,
            set: listener => {
                this.notifyListeners(listener);
            },
        });
    }

    public disable(): void {
        delete window.croct;
        delete window.croctListener;
    }

    private notifyListeners(listeners: CroctListener | CroctListener[] | undefined): void {
        for (const listener of Array.isArray(listeners) ? listeners : [listeners]) {
            if (typeof listener === 'function') {
                listener(this.plug);
            }
        }
    }
}

export const factory = (
    (props): GlobalVariablePlugin => new GlobalVariablePlugin({plug: props.sdk.plug})
) satisfies PluginFactory;
