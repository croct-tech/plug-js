import {TokenStore} from './sdk/token';
import {EvaluatorFacade} from './sdk/evaluation';
import {TrackerFacade} from './sdk/tracking';
import {Tab, Logger, SdkEventManager, SessionFacade, UserFacade, CidAssigner} from './sdk';
import {Plug} from './plug';

export interface PluginSdk {
    readonly version: string;
    readonly appId: string;
    readonly plug: Plug;
    readonly tracker: TrackerFacade;
    readonly evaluator: EvaluatorFacade;
    readonly user: UserFacade;
    readonly session: SessionFacade;
    readonly tab: Tab;
    readonly userTokenStore: TokenStore;
    readonly previewTokenStore: TokenStore;
    readonly cidAssigner: CidAssigner;
    readonly eventManager: SdkEventManager;

    getLogger(...namespace: string[]): Logger;

    getTabStorage(...namespace: string[]): Storage;

    getBrowserStorage(...namespace: string[]): Storage;
}

export interface PluginArguments<T = any> {
    options: T;
    sdk: PluginSdk;
}

export interface PluginFactory<T = any> {
    (args: PluginArguments<T>): Plugin;
}

export interface Plugin {
    enable(): Promise<void>|void;

    disable?(): Promise<void>|void;
}
