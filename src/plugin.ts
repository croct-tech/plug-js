import {TokenStore} from './sdk/token';
import {Evaluator} from './sdk/evaluation';
import {Tracker} from './sdk/tracking';
import {Tab, Logger, SdkEventManager, SessionFacade, UserFacade, CidAssigner} from './sdk';

export interface PluginSdk {
    readonly version: string;
    readonly appId: string;
    readonly tracker: Tracker;
    readonly evaluator: Evaluator;
    readonly user: UserFacade;
    readonly session: SessionFacade;
    readonly tab: Tab;
    readonly tokenStore: TokenStore;
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
