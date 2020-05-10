import {
    EvaluationFacadeOptions as EvaluationOptions,
    ExternalEvent,
    ExternalEventPayload,
    ExternalEventType,
    JsonValue,
    Logger,
    SdkFacade,
    SessionFacade,
    TrackerFacade,
    UserFacade,
} from '@croct-tech/sdk';
import {Plug, Configuration} from './plug';
import {PluginController} from './plugin';

const PLUGIN_NAMESPACE = 'Plugin';

export class GlobalPlug implements Plug {
    private instance?: SdkFacade;

    private plugins: {[key: string]: PluginController} = {};

    private initialize: {(): void};

    private initialized: Promise<void>;

    public constructor() {
        this.initialized = new Promise(resolve => {
            this.initialize = resolve;
        });
    }

    public plug(configuration: Configuration): void {
        if (this.instance !== undefined) {
            const logger = this.instance.getLogger();

            logger.info('Croct is already plugged in.');

            return;
        }

        const {plugins, ...sdkConfiguration} = configuration;
        const sdk = SdkFacade.init(sdkConfiguration);

        this.instance = sdk;

        const logger = this.instance.getLogger();
        const pending: Promise<void>[] = [];

        for (const plugin of plugins ?? []) {
            const pluginName = plugin.getName();

            logger.debug(`Initializing plugin "${pluginName}"...`);

            const controller = plugin.initialize({
                tracker: sdk.tracker,
                evaluator: sdk.evaluator,
                user: sdk.user,
                session: sdk.session,
                tab: sdk.context.getTab(),
                getLogger: (...namespace: string[]): Logger => {
                    return sdk.getLogger(PLUGIN_NAMESPACE, pluginName, ...namespace);
                },
                getTabStorage: (...namespace: string[]): Storage => {
                    return sdk.getTabStorage(PLUGIN_NAMESPACE, pluginName, ...namespace);
                },
                getBrowserStorage: (...namespace: string[]): Storage => {
                    return sdk.getBrowserStorage(PLUGIN_NAMESPACE, pluginName, ...namespace);
                },
            });

            logger.debug(`Plugin "${pluginName}" initialized`);

            if (typeof controller !== 'object') {
                continue;
            }

            this.plugins[pluginName] = controller;

            if (typeof controller.enable === 'function') {
                const promise = controller.enable();

                if (!(promise instanceof Promise)) {
                    logger.debug(`Plugin "${pluginName}" enabled`);

                    continue;
                }

                pending.push(
                    promise
                        .then(() => logger.debug(`Plugin "${pluginName}" enabled`))
                        .catch(() => logger.error(`Failed to enable plugin "${pluginName}"`)),
                );
            }
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

    public get sdk(): SdkFacade {
        if (this.instance === undefined) {
            throw new Error('Croct is not plugged in.');
        }

        return this.instance;
    }

    public get tracker(): TrackerFacade {
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
                    .catch(() => logger.error(`Failed to disable "${pluginName}"`)),
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
