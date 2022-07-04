import {formatCause} from '@croct/sdk/error';
import {CidAssigner} from '@croct/sdk/cid';
import {ContextFactory, TabContextFactory} from '@croct/sdk/facade/evaluatorFacade';
import {Campaign, EvaluationContext, Page} from '@croct/sdk/evaluator';
import {Plugin, PluginFactory} from './plugin';
import {PLAYGROUND_CONNECT_URL, PLAYGROUND_ORIGIN} from './constants';
import {Logger, SdkEventSubscriber, Tab} from './sdk';
import {TokenProvider} from './sdk/token';

const CONNECTION_PARAMETER = '__cplay';

export type Configuration = {
    appId: string,
    connectionId?: string,
    sdkVersion: string,
    tab: Tab,
    contextFactory: ContextFactory,
    storage: Storage,
    eventSubscriber: SdkEventSubscriber,
    cidAssigner: CidAssigner,
    tokenProvider: TokenProvider,
    logger: Logger,
};

export type SyncPayload = {
    appId: string,
    connectionId: string,
    sdkVersion: string,
    cid: string,
    tabId: string,
    token: string|null,
    context: {
        campaign?: Campaign,
        page?: Page,
        timezone?: string,
    },
};

export class PlaygroundPlugin implements Plugin {
    private readonly sdkVersion: string;

    private readonly appId: string;

    private readonly connectionId?: string;

    private readonly tab: Tab;

    private readonly contextFactory: ContextFactory;

    private readonly storage: Storage;

    private readonly eventSubscriber: SdkEventSubscriber;

    private readonly cidAssigner: CidAssigner;

    private readonly tokenProvider: TokenProvider;

    private readonly logger: Logger;

    private syncListener?: {(): void};

    public constructor(configuration: Configuration) {
        this.sdkVersion = configuration.sdkVersion;
        this.appId = configuration.appId;
        this.connectionId = configuration.connectionId;
        this.tab = configuration.tab;
        this.contextFactory = configuration.contextFactory;
        this.storage = configuration.storage;
        this.eventSubscriber = configuration.eventSubscriber;
        this.cidAssigner = configuration.cidAssigner;
        this.tokenProvider = configuration.tokenProvider;
        this.logger = configuration.logger;
    }

    public enable(): Promise<void> | void {
        const connectionId = this.resolveConnectionId();

        if (connectionId === null) {
            return;
        }

        this.syncListener = (): Promise<void> => this.cidAssigner
            .assignCid()
            .then(cid => {
                this.syncToken(connectionId, cid);
            })
            .catch(error => {
                this.logger.warn(`Sync failed: ${formatCause(error)}`);
            });

        this.eventSubscriber.addListener('tokenChanged', this.syncListener);
        this.tab.addListener('urlChange', this.syncListener);

        return this.syncListener();
    }

    private resolveConnectionId(): string | null {
        if (this.connectionId !== undefined) {
            this.logger.debug('Connection ID passed in configuration');

            return this.connectionId;
        }

        const url = new URL(this.tab.url);

        let connectionId = url.searchParams.get(CONNECTION_PARAMETER);

        if (connectionId === null || connectionId === '') {
            this.logger.debug('No connection ID found in URL');

            connectionId = this.storage.getItem('connectionId');

            this.logger.debug(
                connectionId !== null
                    ? 'Previous connection ID found'
                    : 'No previous connection ID found',
            );

            return connectionId;
        }

        this.logger.debug('Connection ID found in URL');

        this.storage.setItem('connectionId', connectionId);

        return connectionId;
    }

    public disable(): Promise<void> | void {
        if (this.syncListener !== undefined) {
            this.eventSubscriber.removeListener('tokenChanged', this.syncListener);
            this.tab.removeListener('urlChange', this.syncListener);

            delete this.syncListener;
        }
    }

    private syncToken(connectionId: string, cid: string): void {
        const iframe = document.createElement('iframe');

        iframe.setAttribute('src', PLAYGROUND_CONNECT_URL);
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.style.visibility = 'hidden';
        iframe.style.opacity = '0';
        iframe.style.border = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';

        const context = this.createContext();

        iframe.onload = (): void => {
            if (iframe.contentWindow === null) {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }

                this.logger.warn('Sync handshake failed');

                return;
            }

            const listener = (event: MessageEvent): void => {
                if (event.origin !== PLAYGROUND_ORIGIN || event.data !== connectionId) {
                    return;
                }

                window.removeEventListener('message', listener);

                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }

                this.logger.debug('Sync completed');
            };

            window.addEventListener('message', listener);

            const payload: SyncPayload = {
                appId: this.appId,
                connectionId: connectionId,
                sdkVersion: this.sdkVersion,
                tabId: this.tab.id,
                cid: cid,
                token: this.tokenProvider
                    .getToken()
                    ?.toString() ?? null,
                context: context,
            };

            iframe.contentWindow.postMessage(payload, PLAYGROUND_ORIGIN);

            this.logger.debug('Waiting for sync acknowledgment...');
        };

        this.logger.debug('Sync started');

        const connect = (): void => {
            document.body.appendChild(iframe);
        };

        if (document.body === null) {
            document.addEventListener('DOMContentLoaded', connect);
        } else {
            connect();
        }
    }

    private createContext(): EvaluationContext {
        const {page, campaign, timezone} = this.contextFactory.createContext();
        const context: EvaluationContext = {};

        if (page !== undefined) {
            context.page = page;
        }

        if (campaign !== undefined) {
            context.campaign = campaign;
        }

        if (timezone !== undefined) {
            context.timezone = timezone;
        }

        return context;
    }
}

export type Options = {
    connectionId?: string,
};

export const factory: PluginFactory<Options> = (props): PlaygroundPlugin => {
    const {sdk, options} = props;

    return new PlaygroundPlugin({
        sdkVersion: sdk.version,
        appId: sdk.appId,
        connectionId: options.connectionId,
        tab: sdk.tab,
        storage: sdk.getTabStorage(),
        tokenProvider: sdk.tokenStore,
        cidAssigner: sdk.cidAssigner,
        contextFactory: new TabContextFactory(sdk.tab),
        eventSubscriber: sdk.eventManager,
        logger: sdk.getLogger(),
    });
};
