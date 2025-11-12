import {Plug} from './plug';

declare global {
    type CroctListener = (instance: Plug) => void;

    interface Window {
        croct?: Plug;
        croctListener: CroctListener | CroctListener[] | undefined;
    }
}
