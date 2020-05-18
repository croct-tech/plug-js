import TrackerFacade from '@croct/sdk/facade/trackerFacade';
import EvaluatorFacade from '@croct/sdk/facade/evaluatorFacade';
import UserFacade from '@croct/sdk/facade/userFacade';
import SessionFacade from '@croct/sdk/facade/sessionFacade';
import Tab from '@croct/sdk/tab';
import {Logger} from '@croct/sdk/logging';

export interface PluginSdk {
    readonly tracker: TrackerFacade;
    readonly evaluator: EvaluatorFacade;
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
