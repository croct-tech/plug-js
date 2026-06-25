import type {TokenStore} from './sdk/token';
import type {EvaluatorFacade} from './sdk/evaluation';
import type {TrackerFacade} from './sdk/tracking';
import type {Tab, Logger, SdkEventManager, SessionFacade, UserFacade, CidAssigner} from './sdk';
import type {Plug} from './plug';

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

const RESERVED_PLUGIN_NAMES: readonly string[] = ['__proto__', 'constructor', 'prototype'];

export function isReservedPluginName(name: string): boolean {
    return RESERVED_PLUGIN_NAMES.includes(name);
}

export namespace PluginSdk {
    export function register(name: string, factory: PluginFactory): void {
        if (isReservedPluginName(name)) {
            throw new Error(`The plugin name "${name}" is reserved and cannot be used.`);
        }

        if (typeof window === 'undefined') {
            return;
        }

        if (window.croctPlugins === undefined) {
            window.croctPlugins = {};
        }

        window.croctPlugins[name] = factory;
    }
}

export interface PluginArguments<T = any> {
    options: T;
    sdk: PluginSdk;
}

export interface PluginFactory<T = any> {
    (args: PluginArguments<T>): Plugin;
}

export interface Plugin {
    enable(): Promise<void> | void;

    disable?(): Promise<void> | void;
}
