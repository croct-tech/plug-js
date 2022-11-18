import {Logger} from '@croct/sdk/logging';
import {SessionFacade} from '@croct/sdk/facade/sessionFacade';
import {UserFacade} from '@croct/sdk/facade/userFacade';
import {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
import {EvaluationOptions, EvaluatorFacade} from '@croct/sdk/facade/evaluatorFacade';
import {Configuration as SdkFacadeConfiguration, SdkFacade} from '@croct/sdk/facade/sdkFacade';
import {formatCause} from '@croct/sdk/error';
import {describe} from '@croct/sdk/validation';
import {Optional} from '@croct/sdk/utilityTypes';
import {Token} from '@croct/sdk/token';
import {
    ExternalTrackingEvent as ExternalEvent,
    ExternalTrackingEventPayload as ExternalEventPayload,
    ExternalTrackingEventType as ExternalEventType,
} from '@croct/sdk/trackingEvents';
import {VERSION} from '@croct/sdk';
import {FetchOptions as BaseFetchOptions} from '@croct/sdk/facade/contentFetcherFacade';
import {Plugin, PluginArguments, PluginFactory} from './plugin';
import {CDN_URL} from './constants';
import {factory as playgroundPluginFactory} from './playground';
import {factory as previewPluginFactory} from './preview';
import {EapFeatures} from './eap';
import {VersionedSlotId, SlotContent} from './slot';
import {JsonValue, JsonObject} from './sdk/json';

export interface PluginConfigurations {
    [key: string]: any;
}

export type Configuration = Optional<SdkFacadeConfiguration, 'appId'> & {
    plugins?: PluginConfigurations,
};

export type FetchOptions = Omit<BaseFetchOptions, 'version'>;

export type FetchResponse<I extends VersionedSlotId, C extends JsonObject = JsonObject> = {
    content: SlotContent<I, C>,
};

/**
 * @internal
 */
export type LegacyFetchResponse<I extends VersionedSlotId, C extends JsonObject = JsonObject> = FetchResponse<I, C> & {
    /**
     * @deprecated Use `content` instead.
     */
    payload: SlotContent<I, C>,
};

export interface Plug extends EapFeatures {
    readonly tracker: TrackerFacade;
    readonly user: UserFacade;
    readonly session: SessionFacade;
    readonly initialized: boolean;
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

    evaluate<T extends JsonValue>(expression: string, options?: EvaluationOptions): Promise<T>;

    fetch<P extends JsonObject, I extends VersionedSlotId>(
        slotId: I,
        options?: FetchOptions
    ): Promise<LegacyFetchResponse<I, P>>;

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
    private pluginFactories: {[key: string]: PluginFactory} = {
        playground: playgroundPluginFactory,
        preview: previewPluginFactory,
    };

    private instance?: SdkFacade;

    private plugins: {[key: string]: Plugin} = {};

    private initialize: {(): void};

    private ready: Promise<void>;

    public constructor() {
        this.ready = new Promise(resolve => {
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

        const {plugins, test, ...sdkConfiguration} = configuration;

        const sdk = SdkFacade.init({
            ...sdkConfiguration,
            appId: appId,
            test: test ?? (typeof process === 'object' && (
                process.env?.CROCT_TEST_MODE !== undefined
                    ? process.env.CROCT_TEST_MODE === 'true'
                    : process.env?.NODE_ENV === 'test'
            )),
        });

        this.instance = sdk;

        const logger = this.instance.getLogger();

        if (detectedAppId === configuredAppId) {
            logger.warn(
                'It is strongly recommended omitting the "appId" option when using '
                + 'the application-specific tag as it is detected automatically.',
            );
        }

        const pending: Array<Promise<void>> = [];

        const defaultEnabledPlugins = Object.fromEntries(
            Object.keys(this.pluginFactories)
                .map(name => [name, true]),
        );

        for (const [name, options] of Object.entries({...defaultEnabledPlugins, ...plugins})) {
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
                    version: VERSION,
                    appId: appId,
                    tracker: sdk.tracker,
                    evaluator: sdk.evaluator,
                    user: sdk.user,
                    session: sdk.session,
                    tab: sdk.context.getTab(),
                    userTokenStore: {
                        getToken: sdk.getToken.bind(sdk),
                        setToken: sdk.setToken.bind(sdk),
                    },
                    previewTokenStore: sdk.previewTokenStore,
                    cidAssigner: sdk.cidAssigner,
                    eventManager: sdk.eventManager,
                    getLogger: (...namespace: string[]): Logger => sdk.getLogger(PLUGIN_NAMESPACE, name, ...namespace),
                    getTabStorage: (...namespace: string[]): Storage => (
                        sdk.getTabStorage(PLUGIN_NAMESPACE, name, ...namespace)
                    ),
                    getBrowserStorage: (...namespace: string[]): Storage => (
                        sdk.getBrowserStorage(PLUGIN_NAMESPACE, name, ...namespace)
                    ),
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
                promise.then(() => logger.debug(`Plugin "${name}" enabled`))
                    .catch(error => logger.error(`Failed to enable plugin "${name}": ${formatCause(error)}`)),
            );
        }

        const initializeEap = window.croctEap?.initialize;

        if (typeof initializeEap === 'function') {
            initializeEap.call(this);
        }

        Promise.all(pending)
            .then(() => {
                this.initialize();

                logger.debug('Initialization complete');
            });
    }

    public get initialized(): boolean {
        return this.instance !== undefined;
    }

    public get plugged(): Promise<this> {
        return this.ready.then(() => this);
    }

    public get flushed(): Promise<this> {
        return this.tracker
            .flushed
            .then(() => this);
    }

    private get sdk(): SdkFacade {
        if (this.instance === undefined) {
            throw new Error('Croct is not plugged in.');
        }

        return this.instance;
    }

    public get tracker(): TrackerFacade {
        return this.sdk.tracker;
    }

    public get evaluator(): EvaluatorFacade {
        return this.sdk.evaluator;
    }

    public get user(): UserFacade {
        return this.sdk.user;
    }

    public get session(): SessionFacade {
        return this.sdk.session;
    }

    public isAnonymous(): boolean {
        return this.sdk
            .context
            .isAnonymous();
    }

    public getUserId(): string | null {
        return this.sdk
            .context
            .getUser();
    }

    public identify(userId: string): void {
        if (typeof userId !== 'string') {
            throw new Error('The user ID must be a string. Read more on https://croct.help/plug-js/id-conversion');
        }

        this.sdk.identify(userId);
    }

    public anonymize(): void {
        this.sdk.anonymize();
    }

    public setToken(token: string): void {
        this.sdk.setToken(Token.parse(token));
    }

    public unsetToken(): void {
        this.sdk.unsetToken();
    }

    public track<T extends ExternalEventType>(type: T, payload: ExternalEventPayload<T>): Promise<ExternalEvent<T>> {
        return this.sdk
            .tracker
            .track(type, payload);
    }

    public evaluate<T extends JsonValue>(expression: string, options: EvaluationOptions = {}): Promise<T> {
        return this.sdk
            .evaluator
            .evaluate(expression, options) as Promise<T>;
    }

    public test(expression: string, options: EvaluationOptions = {}): Promise<boolean> {
        return this.evaluate(expression, options)
            .then(result => result === true);
    }

    public get fetch(): Plug['fetch'] {
        return this.eap(
            'fetch',
            <C extends JsonObject, I extends VersionedSlotId = VersionedSlotId>(
                slotId: I,
                options: FetchOptions = {},
            ): Promise<LegacyFetchResponse<I, C>> => {
                const [id, version] = slotId.split('@') as [string, `${number}` | 'latest' | undefined];
                const logger = this.sdk.getLogger();

                return this.sdk
                    .contentFetcher
                    .fetch<SlotContent<I, C>>(id, {
                        ...options,
                        version: version === 'latest' ? undefined : version,
                    })
                    .then(
                        response => ({
                            get payload(): SlotContent<I, C> {
                                logger.warn(
                                    'Accessing the "payload" property of the fetch response is deprecated'
                                    + ' and will be removed in a future version. Use the "content" property instead.',
                                );

                                return response.content;
                            },
                            content: response.content,
                        }),
                    );
            },
        );
    }

    public async unplug(): Promise<void> {
        if (this.instance === undefined) {
            return;
        }

        const {instance, plugins} = this;

        const logger = this.sdk.getLogger();
        const pending: Array<Promise<void>> = [];

        for (const [pluginName, controller] of Object.entries(plugins)) {
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
                promise.then(() => logger.debug(`Plugin "${pluginName}" disabled`))
                    .catch(error => logger.error(`Failed to disable "${pluginName}": ${formatCause(error)}`)),
            );
        }

        // Reset
        delete this.instance;

        this.plugins = {};
        this.ready = new Promise(resolve => {
            this.initialize = resolve;
        });

        await Promise.all(pending);

        try {
            await instance.close();
        } finally {
            logger.info('🔌 Croct has been unplugged.');
        }
    }

    private eap<T extends keyof EapFeatures>(feature: T, api: EapFeatures[T]): EapFeatures[T] {
        const eap = window.croctEap;
        const method: EapFeatures[T] | undefined = typeof eap === 'object' ? eap[feature] : undefined;

        if (typeof method !== 'function') {
            return api;
        }

        return method.bind(
            new Proxy(this, {
                get: (plug, property): any => {
                    if (property === feature) {
                        return api;
                    }

                    return plug[property as keyof GlobalPlug];
                },
            }),
        );
    }
}
