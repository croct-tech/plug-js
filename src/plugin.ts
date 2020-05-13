import {
    TrackerFacade as Tracker,
    EvaluatorFacade as Evaluator,
    UserFacade,
    SessionFacade,
    Logger,
    Tab,
} from '@croct-tech/sdk';

export interface PluginSdk {
    readonly tracker: Tracker;
    readonly evaluator: Evaluator;
    readonly user: UserFacade;
    readonly session: SessionFacade;
    readonly tab: Tab;

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
