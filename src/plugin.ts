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

export interface PluginController {
    enable?(): Promise<void>|void;

    disable?(): Promise<void>|void;
}

export interface Plugin {
    getName(): string;

    initialize(sdk: PluginSdk): PluginController|void;
}
