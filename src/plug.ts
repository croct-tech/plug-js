import type {Logger} from '@croct/sdk/logging';
import type {SessionFacade} from '@croct/sdk/facade/sessionFacade';
import type {UserFacade} from '@croct/sdk/facade/userFacade';
import type {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
import type {EvaluationOptions, EvaluatorFacade} from '@croct/sdk/facade/evaluatorFacade';
import type {Configuration as SdkFacadeConfiguration} from '@croct/sdk/facade/sdkFacade';
import {SdkFacade} from '@croct/sdk/facade/sdkFacade';
import {formatCause} from '@croct/sdk/error';
import {describe} from '@croct/sdk/validation';
import type {Optional} from '@croct/sdk/utilityTypes';
import {Token} from '@croct/sdk/token';
import type {
    ExternalTrackingEvent as ExternalEvent,
    ExternalTrackingEventPayload as ExternalEventPayload,
    ExternalTrackingEventType as ExternalEventType,
} from '@croct/sdk/trackingEvents';
import {VERSION} from '@croct/sdk';
import type {FetchOptions as BaseFetchOptions} from '@croct/sdk/facade/contentFetcherFacade';
import type {FetchResponseOptions, FetchResponse as BaseFetchResponse} from '@croct/sdk/contentFetcher';
import {loadSlotContent} from '@croct/content';
import type {Plugin, PluginArguments, PluginFactory} from './plugin';
import {isReservedPluginName} from './plugin';
import {CDN_URL} from './constants';
import {factory as previewPluginFactory} from './plugins/preview';
import {factory as autoTrackingPluginFactory} from './plugins/autoTracking';
import type {VersionedSlotId, SlotContent} from './slot';
import type {JsonValue, JsonObject} from './sdk/json';
import {factory as globalVariablePluginFactory} from './plugins/globalVariable';

export interface PluginConfigurations {
    [key: string]: any;
}

export type Configuration = Optional<SdkFacadeConfiguration, 'appId'> & {
    plugins?: PluginConfigurations,
};

export type FetchOptions<T> = Omit<BaseFetchOptions, 'version'> & {
    fallback?: T,
};

export type FetchResponse<
    I extends VersionedSlotId,
    C extends JsonObject = JsonObject,
    F = never,
    O extends FetchResponseOptions = FetchResponseOptions,
> = Optional<BaseFetchResponse<SlotContent<I, C> | F, O>, 'metadata'>;

export interface Plug {
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

    fetch<I extends VersionedSlotId, O extends FetchResponseOptions>(
        slotId: I,
        options?: O & FetchOptions<SlotContent<I>>
    ): Promise<FetchResponse<I, JsonObject, never, O>>;

    fetch<F, I extends VersionedSlotId, O extends FetchResponseOptions>(
        slotId: I,
        options?: O & FetchOptions<SlotContent<I> | F>
    ): Promise<FetchResponse<I, JsonObject, F, O>>;

    unplug(): Promise<void>;
}

const PLUGIN_NAMESPACE = 'Plugin';

const objectHasOwnProperty = Object.prototype.hasOwnProperty;

function hasOwn(target: object, property: PropertyKey): boolean {
    return objectHasOwnProperty.call(target, property);
}

/**
 * The state of a single plug session needed to enable plugins.
 */
type PluginContext = {
    sdk: SdkFacade,
    appId: string,
    logger: Logger,
};

function detectAppId(): string | null {
    const script = window.document.querySelector(`script[src^='${CDN_URL}']`);

    if (!(script instanceof HTMLScriptElement)) {
        return null;
    }

    return (new URL(script.src)).searchParams.get('appId');
}

export class GlobalPlug implements Plug {
    public static readonly GLOBAL = new GlobalPlug();

    private pluginFactories: {[key: string]: PluginFactory} = {
        preview: previewPluginFactory,
        globalVariable: globalVariablePluginFactory,
        autoTracking: autoTrackingPluginFactory,
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
        if (isReservedPluginName(name)) {
            throw new Error(`The plugin name "${name}" is reserved and cannot be used.`);
        }

        if (hasOwn(this.pluginFactories, name)) {
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
                + 'Please try again omitting the "appId" option. '
                + 'For help, see https://croct.help/sdk/javascript/conflicting-app-id',

            );
        }

        const appId = detectedAppId ?? configuredAppId;

        if (appId === null) {
            throw new Error(
                'The app ID must be specified when it cannot be auto-detected. '
                + 'Please try again specifying the "appId" option.'
                + 'For help, see https://croct.help/sdk/javascript/missing-app-id',
            );
        }

        const {plugins, test, ...sdkConfiguration} = configuration;

        if (sdkConfiguration.defaultPreferredLocale === '') {
            delete sdkConfiguration.defaultPreferredLocale;
        }

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

        const configurations = plugins ?? {};
        const context: PluginContext = {
            sdk: sdk,
            appId: appId,
            logger: logger,
        };

        this.watchPluginRegistry(context, configurations);

        const pending: Array<Promise<void>> = [];

        const defaultEnabledPlugins = Object.fromEntries(
            Object.keys(this.pluginFactories)
                .map(name => [name, true]),
        );

        for (const [name, options] of Object.entries({...defaultEnabledPlugins, ...configurations})) {
            const promise = this.enablePlugin(name, options, context);

            if (promise instanceof Promise) {
                pending.push(promise);
            }
        }

        Promise.all(pending)
            .then(() => {
                this.initialize();

                logger.debug('Initialization complete');
            });
    }

    /**
     * Registers plugins declared on the `window.croctPlugins` global registry.
     *
     * Plugins already present are registered eagerly so they are enabled as part
     * of the regular initialization. The registry is then replaced with a proxy
     * that registers and enables any plugin declared after the plug is loaded,
     * making the registration order irrelevant.
     *
     * The proxy traps the captured session: once the plug is unplugged or plugged
     * again, the `this.instance === context.sdk` check turns it inert, so no
     * registry state has to be reset on the instance.
     */
    private watchPluginRegistry(context: PluginContext, configurations: PluginConfigurations): void {
        const {sdk, logger} = context;

        // Spread into a fresh object so a proxy installed by a previous session is
        // discarded rather than re-wrapped, preventing proxies from nesting.
        const registry = {...window.croctPlugins};

        for (const [name, factory] of Object.entries(registry)) {
            this.registerExternalPlugin(name, factory, logger);
        }

        window.croctPlugins = new Proxy(registry, {
            set: (target, property, factory): boolean => {
                const result = Reflect.set(target, property, factory);

                if (result && this.instance === sdk && typeof property === 'string') {
                    if (this.registerExternalPlugin(property, factory, logger)) {
                        // Read the options as an own property only, so inherited keys
                        // such as `toString` are treated as "not configured".
                        const options = hasOwn(configurations, property) ? configurations[property] : true;

                        void this.enablePlugin(property, options, context);
                    }
                }

                return result;
            },
            deleteProperty: (target, property): boolean => {
                if (this.instance === sdk && typeof property === 'string' && hasOwn(this.pluginFactories, property)) {
                    logger.error(
                        `Plugin "${property}" cannot be unregistered; `
                        + 'it will remain registered until the page is reloaded.',
                    );
                }

                return Reflect.deleteProperty(target, property);
            },
        });
    }

    /**
     * Registers a plugin factory declared on the global registry.
     *
     * Unlike {@link extend}, conflicts are tolerated so a single malformed or
     * duplicated declaration cannot prevent the plug from initializing. A factory
     * already registered under the same name is silently ignored, allowing the
     * registry to be safely re-scanned across re-plugs.
     *
     * @returns Whether the factory was newly registered.
     */
    private registerExternalPlugin(name: string, factory: unknown, logger: Logger): boolean {
        if (isReservedPluginName(name)) {
            logger.error(`The plugin name "${name}" is reserved and cannot be used, ignoring it.`);

            return false;
        }

        if (typeof factory !== 'function') {
            logger.error(`The plugin "${name}" declared globally is not a valid factory, ignoring it.`);

            return false;
        }

        const registered = hasOwn(this.pluginFactories, name) ? this.pluginFactories[name] : undefined;

        if (registered !== undefined) {
            if (registered !== factory) {
                logger.warn(`Plugin "${name}" is already registered, ignoring global registration.`);
            }

            return false;
        }

        this.pluginFactories[name] = factory as PluginFactory;

        return true;
    }

    /**
     * Instantiates and enables a single plugin.
     *
     * @returns A promise that resolves once the plugin is enabled, or nothing if
     *          the plugin is synchronous, disabled, or could not be initialized.
     */
    private enablePlugin(name: string, options: unknown, context: PluginContext): Promise<void> | void {
        const {sdk, appId, logger} = context;

        if (isReservedPluginName(name)) {
            logger.error(`The plugin name "${name}" is reserved and cannot be used, ignoring it.`);

            return;
        }

        logger.debug(`Initializing plugin "${name}"...`);

        const factory = hasOwn(this.pluginFactories, name) ? this.pluginFactories[name] : undefined;

        if (factory === undefined) {
            logger.error(`Plugin "${name}" is not registered.`);

            return;
        }

        if (typeof options !== 'boolean' && (options === null || typeof options !== 'object')) {
            logger.error(
                `Invalid options for plugin "${name}", `
                + `expected either boolean or object but got ${describe(options)}`,
            );

            return;
        }

        if (options === false) {
            logger.warn(`Plugin "${name}" is declared but not enabled`);

            return;
        }

        const args: PluginArguments = {
            options: options === true ? {} : options,
            sdk: {
                version: VERSION,
                appId: appId,
                plug: this,
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

            return;
        }

        logger.debug(`Plugin "${name}" initialized`);

        if (typeof plugin !== 'object') {
            return;
        }

        this.plugins[name] = plugin;

        const promise = plugin.enable();

        if (!(promise instanceof Promise)) {
            logger.debug(`Plugin "${name}" enabled`);

            return;
        }

        return promise.then(() => logger.debug(`Plugin "${name}" enabled`))
            .catch(error => logger.error(`Failed to enable plugin "${name}": ${formatCause(error)}`));
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
            throw new Error('Croct is not plugged in. For help, see https://croct.help/sdk/javascript/not-plugged-in');
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
            throw new Error(
                'The user ID must be a string. For help, see https://croct.help/sdk/javascript/invalid-user-id',
            );
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

    public evaluate<T extends JsonValue>(query: string, options: EvaluationOptions = {}): Promise<T> {
        return this.sdk
            .evaluator
            .evaluate(query, options)
            .catch(error => {
                const logger = this.sdk.getLogger();
                const reference = query.length > 20 ? `${query.slice(0, 20)}...` : query;

                logger.error(`Failed to evaluate query "${reference}": ${formatCause(error)}`);

                throw error;
            }) as Promise<T>;
    }

    public test(expression: string, options: EvaluationOptions = {}): Promise<boolean> {
        return this.evaluate(expression, options)
            .then(result => result === true);
    }

    public fetch<I extends VersionedSlotId, O extends FetchResponseOptions>(
        slotId: I,
        options?: O & FetchOptions<SlotContent<I>>
    ): Promise<FetchResponse<I, JsonObject, never, O>>;

    public fetch<F, I extends VersionedSlotId, O extends FetchResponseOptions>(
        slotId: I,
        options?: O & FetchOptions<SlotContent<I> | F>
    ): Promise<FetchResponse<I, JsonObject, F, O>>;

    public fetch<I extends VersionedSlotId = VersionedSlotId>(
        slotId: I,
        {fallback, preferredLocale = '', ...options}: FetchOptions<SlotContent<I>> = {},
    ): Promise<FetchResponse<I>> {
        const [id, version = 'latest'] = slotId.split('@') as [string, `${number}` | 'latest' | undefined];
        const logger = this.sdk.getLogger();
        const normalizedLocale = preferredLocale === '' ? undefined : preferredLocale;

        return this.sdk
            .contentFetcher
            .fetch<SlotContent<I>, FetchResponseOptions>(id, {
                ...options,
                ...(normalizedLocale !== undefined ? {preferredLocale: normalizedLocale} : {}),
                ...(version !== 'latest' ? {version: version} : {}),
            })
            .catch(async error => {
                logger.error(`Failed to fetch content for slot "${id}@${version}": ${formatCause(error)}`);

                const resolvedFallback = fallback === undefined
                    ? (await loadSlotContent(slotId, normalizedLocale) as SlotContent<I> | null ?? undefined)
                    : fallback;

                if (resolvedFallback === undefined) {
                    throw error;
                }

                return {
                    content: resolvedFallback,
                };
            });
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
}
