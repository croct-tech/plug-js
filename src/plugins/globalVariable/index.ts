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
            const listeners = Array.isArray(window.croctListener) ? window.croctListener : [window.croctListener];

            for (const listener of listeners) {
                if (typeof listener === 'function') {
                    listener(this.plug);
                }
            }
        }
    }

    public disable(): void {
        delete window.croct;
    }
}

export const factory = (
    (props): GlobalVariablePlugin => new GlobalVariablePlugin({plug: props.sdk.plug})
) satisfies PluginFactory;
