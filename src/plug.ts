import {ExternalEvent, ExternalEventPayload, ExternalEventType} from '@croct/sdk/event';
import {Logger} from '@croct/sdk/logging';
import {JsonValue} from '@croct/sdk/json';
import SessionFacade from '@croct/sdk/facade/sessionFacade';
import UserFacade from '@croct/sdk/facade/userFacade';
import Tracker from '@croct/sdk/facade/trackerFacade';
import {EvaluationOptions} from '@croct/sdk/facade/evaluatorFacade';
import Sdk, {Configuration as SdkFacadeConfiguration} from '@croct/sdk/facade/sdkFacade';
import {formatCause} from '@croct/sdk/error';
import {describe} from '@croct/sdk/validation';
import {Optional} from '@croct/sdk/utilityTypes';
import {Plugin, PluginArguments, PluginFactory} from './plugin';
import {CDN_URL} from './constants';

export interface PluginConfigurations {
    [key: string]: any;
}

export type Configuration = Optional<SdkFacadeConfiguration, 'appId'> & {
    plugins?: PluginConfigurations,
}

export interface Plug {
    readonly tracker: Tracker;
    readonly user: UserFacade;
    readonly session: SessionFacade;
    readonly flushed: Promise<this>;
    readonly plugged: Promise<this>;

    plug(configuration: Configuration): void;

    isAnonymous(): boolean;

    getUserId(): string | null;

    identify(userId: string): void;

    anonymize(): void;

    setToken(token: string): void;

    unsetToken(): void;

    track<T extends ExternalEventType>(type: T, payload: ExternalEventPayload<T>): Promise<ExternalEvent<T>>;

    evaluate(expression: string, options?: EvaluationOptions): Promise<JsonValue>;

    unplug(): Promise<void>;
}

const PLUGIN_NAMESPACE = 'Plugin';

function detectAppId(): string | null {
    const script = window.document.querySelector(`script[src^='${CDN_URL}']`);

    if (!(script instanceof HTMLScriptElement)) {
        return null;
    }

    return (new URL(script.src)).searchParams.get('appId');
}

export class GlobalPlug implements Plug {
    private pluginFactories: {[key: string]: PluginFactory} = {};

    private instance?: Sdk;

    private plugins: {[key: string]: Plugin} = {};

    private initialize: {(): void};

    private initialized: Promise<void>;

    public constructor() {
        this.initialized = new Promise(resolve => {
            this.initialize = resolve;
        });
    }

    public extend(name: string, plugin: PluginFactory): void {
        if (this.pluginFactories[name] !== undefined) {
            throw new Error(`Another plugin is already registered with name "${name}".`);
        }

        this.pluginFactories[name] = plugin;
    }

    public plug(configuration: Configuration = {}): void {
        if (this.instance !== undefined) {
            const logger = this.instance.getLogger();

            logger.info('Croct is already plugged in.');

            return;
        }

        const detectedAppId = detectAppId();
        const configuredAppId = configuration.appId ?? null;

        if (detectedAppId !== null && configuredAppId !== null && detectedAppId !== configuredAppId) {
            throw new Error(
                'The specified app ID and the auto-detected app ID are conflicting. '
                + 'There is no need to specify an app ID when using an application-specific tag. '
                + 'Please try again omitting the "appId" option.',
            );
        }

        const appId = detectedAppId ?? configuredAppId;

        if (appId === null) {
            throw new Error(
                'The app ID must be specified when it cannot be auto-detected. '
                + 'Please try again specifying the "appId" option.',
            );
        }

        const {plugins, ...sdkConfiguration} = configuration;

        const sdk = Sdk.init({
            ...sdkConfiguration,
            appId: appId,
        });

        this.instance = sdk;

        const logger = this.instance.getLogger();

        if (detectedAppId === configuredAppId) {
            logger.warn(
                'It is strongly recommended omitting the "appId" option when using '
                + 'the application-specific tag as it is detected automatically.',
            );
        }

        const pending: Promise<void>[] = [];

        for (const [name, options] of Object.entries(plugins ?? {})) {
            logger.debug(`Initializing plugin "${name}"...`);

            const factory = this.pluginFactories[name];

            if (factory === undefined) {
                logger.error(`Plugin "${name}" is not registered.`);

                continue;
            }

            if (typeof options !== 'boolean' && (options === null || typeof options !== 'object')) {
                logger.error(
                    `Invalid options for plugin "${name}", `
                    + `expected either boolean or object but got ${describe(options)}`,
                );

                continue;
            }

            if (options === false) {
                logger.warn(`Plugin "${name}" is declared but not enabled`);

                continue;
            }

            const args: PluginArguments = {
                options: options === true ? {} : options,
                sdk: {
                    tracker: sdk.tracker,
                    evaluator: sdk.evaluator,
                    user: sdk.user,
                    session: sdk.session,
                    tab: sdk.context.getTab(),
                    getLogger: (...namespace: string[]): Logger => {
                        return sdk.getLogger(PLUGIN_NAMESPACE, name, ...namespace);
                    },
                    getTabStorage: (...namespace: string[]): Storage => {
                        return sdk.getTabStorage(PLUGIN_NAMESPACE, name, ...namespace);
                    },
                    getBrowserStorage: (...namespace: string[]): Storage => {
                        return sdk.getBrowserStorage(PLUGIN_NAMESPACE, name, ...namespace);
                    },
                },
            };

            let plugin;

            try {
                plugin = factory(args);
            } catch (error) {
                logger.error(`Failed to initialize plugin "${name}": ${formatCause(error)}`);

                continue;
            }

            logger.debug(`Plugin "${name}" initialized`);

            if (typeof plugin !== 'object') {
                continue;
            }

            this.plugins[name] = plugin;

            const promise = plugin.enable();

            if (!(promise instanceof Promise)) {
                logger.debug(`Plugin "${name}" enabled`);

                continue;
            }

            pending.push(
                promise
                    .then(() => logger.debug(`Plugin "${name}" enabled`))
                    .catch(error => logger.error(`Failed to enable plugin "${name}": ${formatCause(error)}`)),
            );
        }

        Promise.all(pending).then(() => {
            this.initialize();

            logger.debug('Initialization complete');
        });
    }

    public get plugged(): Promise<this> {
        return this.initialized.then(() => this);
    }

    public get flushed(): Promise<this> {
        return this.tracker.flushed.then(() => this);
    }

    private get sdk(): Sdk {
        if (this.instance === undefined) {
            throw new Error('Croct is not plugged in.');
        }

        return this.instance;
    }

    public get tracker(): Tracker {
        return this.sdk.tracker;
    }

    public get user(): UserFacade {
        return this.sdk.user;
    }

    public get session(): SessionFacade {
        return this.sdk.session;
    }

    public isAnonymous(): boolean {
        return this.sdk.context.isAnonymous();
    }

    public getUserId(): string | null {
        return this.sdk.context.getUser();
    }

    public identify(userId: string): void {
        this.sdk.identify(userId);
    }

    public anonymize(): void {
        this.sdk.anonymize();
    }

    public setToken(token: string): void {
        this.sdk.setToken(token);
    }

    public unsetToken(): void {
        this.sdk.unsetToken();
    }

    public track<T extends ExternalEventType>(type: T, payload: ExternalEventPayload<T>): Promise<ExternalEvent<T>> {
        return this.sdk.track(type, payload);
    }

    public evaluate(expression: string, options: EvaluationOptions = {}): Promise<JsonValue> {
        return this.sdk.evaluate(expression, options);
    }

    public test(expression: string, options: EvaluationOptions = {}): Promise<boolean> {
        return this.sdk.evaluate(expression, options)
            .then(result => result === true);
    }

    public async unplug(): Promise<void> {
        if (this.instance === undefined) {
            return;
        }

        const logger = this.sdk.getLogger();
        const pending: Promise<void>[] = [];

        for (const [pluginName, controller] of Object.entries(this.plugins)) {
            if (typeof controller.disable !== 'function') {
                continue;
            }

            logger.debug(`Disabling plugin "${pluginName}"...`);

            const promise = controller.disable();

            if (!(promise instanceof Promise)) {
                logger.debug(`Plugin "${pluginName}" disabled`);

                continue;
            }

            pending.push(
                promise
                    .then(() => logger.debug(`Plugin "${pluginName}" disabled`))
                    .catch(error => logger.error(`Failed to disable "${pluginName}": ${formatCause(error)}`)),
            );
        }

        await Promise.all(pending);

        try {
            await this.instance.close();
        } finally {
            delete this.instance;

            this.plugins = {};
            this.initialized = new Promise(resolve => {
                this.initialize = resolve;
            });

            logger.info('🔌 Croct has been unplugged.');
        }
    }
}
