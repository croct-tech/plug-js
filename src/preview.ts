import {formatCause} from '@croct/sdk/error';
import {Logger} from './sdk';
import {Plugin, PluginFactory} from './plugin';
import {Token, TokenStore} from './sdk/token';
import {PREVIEW_WIDGET_ORIGIN, PREVIEW_WIDGET_URL} from './constants';

const PREVIEW_PARAMETER = 'croct-preview';
const PREVIEW_EXIT = 'exit';

export type Configuration = {
    tokenStore: TokenStore,
    logger: Logger,
};

export class PreviewPlugin implements Plugin {
    private static readonly PREVIEW_PARAMS = {
        experienceName: 'experience',
        experimentName: 'experiment',
        audienceName: 'audience',
        variantName: 'variant',
        previewMode: 'previewMode',
    };

    private readonly tokenStore: TokenStore;

    private readonly logger: Logger;

    private cleanUp: Array<() => void> = [];

    public constructor(configuration: Configuration) {
        this.tokenStore = configuration.tokenStore;
        this.logger = configuration.logger;
    }

    public enable(): void {
        const url = new URL(window.location.href);
        const previewData = url.searchParams.get(PREVIEW_PARAMETER);

        if (previewData !== null) {
            this.updateToken(previewData);

            this.updateUrl();

            // Some frameworks (e.g. Next) may revert the URL change
            // after the page is loaded, so ensure the token is removed
            // from the URL after a short delay.
            setTimeout(this.updateUrl, 500);
        }

        const token = this.tokenStore.getToken();

        if (token !== null) {
            this.insertWidget(this.getWidgetUrl(token));
        }
    }

    public disable(): void {
        const callbacks = this.cleanUp.splice(0);

        callbacks.forEach(cleanUp => cleanUp());
    }

    private updateToken(data: string): void {
        if (data === PREVIEW_EXIT) {
            this.logger.debug('Exiting preview mode.');

            this.tokenStore.setToken(null);

            return;
        }

        try {
            let token: Token | null = Token.parse(data);
            const {exp} = token.getPayload();

            if (exp !== undefined && exp <= Date.now() / 1000) {
                this.logger.debug('Preview token expired.');

                token = null;
            }

            this.logger.debug('Preview token updated.');

            this.tokenStore.setToken(token);
        } catch (error) {
            this.tokenStore.setToken(null);

            this.logger.warn(`Invalid preview token: ${formatCause(error)}`);
        }
    }

    private getWidgetUrl(token: Token): string {
        const params = this.getWidgetParams(token);
        let queryString = params.toString();

        if (queryString !== '') {
            queryString = `?${queryString}`;
        }

        return `${PREVIEW_WIDGET_URL}${queryString}`;
    }

    private getWidgetParams(token: Token): URLSearchParams {
        const {metadata = {}} = token.getPayload();
        const params = new URLSearchParams();

        if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
            return params;
        }

        for (const [key, param] of Object.entries(PreviewPlugin.PREVIEW_PARAMS)) {
            const value = metadata[key];

            if (typeof value === 'string') {
                params.set(param, value);
            }
        }

        return params;
    }

    private insertWidget(url: string): void {
        const widget = this.createWidget(url);

        const onMessage = (event: MessageEvent): void => {
            if (event.origin !== PREVIEW_WIDGET_ORIGIN) {
                return;
            }

            switch (event.data.type) {
                case 'croct:preview:leave': {
                    this.tokenStore.setToken(null);

                    const exitUrl = new URL(window.location.href);

                    exitUrl.searchParams.set(PREVIEW_PARAMETER, PREVIEW_EXIT);

                    window.location.replace(exitUrl.toString());

                    break;
                }

                case 'croct:preview:resize':
                    widget.style.width = `${event.data.width}px`;
                    widget.style.height = `${event.data.height}px`;

                    break;
            }
        };

        window.addEventListener('message', onMessage);

        this.cleanUp.push(() => window.removeEventListener('message', onMessage));

        const insert = (): void => {
            const container = document.body;

            container.prepend(widget);

            this.cleanUp.push(() => container.removeChild(widget));

            this.logger.debug('Preview widget mounted.');

            // Reinsert the widget if it is removed from the DOM (e.g. by a framework)
            const observer = new MutationObserver(() => {
                if (!container.contains(widget)) {
                    container.prepend(widget);

                    this.logger.debug('Preview widget removed from DOM, reinserting.');
                }
            });

            observer.observe(container, {childList: true});

            // Make sure the observer is disconnected before the widget is removed.
            // Otherwise, the observer may reinsert the widget after it is removed.
            this.cleanUp.unshift(() => observer.disconnect());
        };

        if (document.readyState !== 'loading') {
            insert();
        } else {
            this.logger.debug('Waiting for document to be ready.');
            this.cleanUp.push(() => window.removeEventListener('DOMContentLoaded', insert));
            window.addEventListener('DOMContentLoaded', insert);
        }
    }

    private updateUrl(): void {
        const url = new URL(window.location.href);

        if (url.searchParams.has(PREVIEW_PARAMETER)) {
            url.searchParams.delete(PREVIEW_PARAMETER);

            window.history.replaceState({}, '', url.toString());
        }
    }

    private createWidget(url: string): HTMLIFrameElement {
        const widget = document.createElement('iframe');

        widget.setAttribute('src', url);
        widget.setAttribute('sandbox', 'allow-scripts allow-same-origin');

        widget.style.position = 'fixed';
        widget.style.width = '0px';
        widget.style.height = '0px';
        widget.style.right = '0';
        widget.style.bottom = '0';
        widget.style.border = '0';
        widget.style.overflow = 'hidden';
        widget.style.zIndex = '2147483647';

        return widget;
    }
}

export const factory: PluginFactory = (props): PreviewPlugin => {
    const {sdk} = props;

    return new PreviewPlugin({
        tokenStore: props.sdk.previewTokenStore,
        logger: sdk.getLogger(),
    });
};
