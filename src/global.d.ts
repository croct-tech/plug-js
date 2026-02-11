import type {Plug} from './plug';

declare global {
    type CroctCallback = (instance: Plug) => void;

    interface Window {
        croct?: Plug;
        onCroctLoad: CroctCallback | undefined;
    }
}
