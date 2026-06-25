import type {Plug} from './plug';
import type {PluginFactory} from './plugin';

declare global {
    type CroctCallback = (instance: Plug) => void;

    interface Window {
        croct?: Plug;
        onCroctLoad: CroctCallback | undefined;
        croctPlugins?: Record<string, PluginFactory>;
    }
}
