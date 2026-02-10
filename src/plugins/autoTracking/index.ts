import {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
import {Tab} from '@croct/sdk/tab';
import {Plugin, PluginFactory} from '../../plugin';
import {parseEntity, ArticleEntity, ProductEntity} from './structuredData';

export type Configuration = {
    tab: Tab,
    tracker: TrackerFacade,
    options?: Options,
};

export type Options = {
    disablePostViewed?: boolean,
    disableProductViewed?: boolean,
    disableLinkOpened?: boolean,
};

export class AutoTrackingPlugin implements Plugin {
    private readonly tab: Tab;

    private readonly tracker: TrackerFacade;

    private readonly options?: Options;

    private observer: MutationObserver | null = null;

    private readonly trackedEntities: Set<string> = new Set();

    private scanScheduled = false;

    public constructor(configuration: Configuration) {
        this.tab = configuration.tab;
        this.tracker = configuration.tracker;
        this.options = configuration.options;
        this.trackStructuredData = this.trackStructuredData.bind(this);
        this.trackLinkOpened = this.trackLinkOpened.bind(this);
        this.handleUrlChange = this.handleUrlChange.bind(this);
        this.handleMutations = this.handleMutations.bind(this);
        this.handlePageShow = this.handlePageShow.bind(this);
    }

    private isDisabled(): boolean {
        return this.options?.disablePostViewed === true
            && this.options?.disableProductViewed === true
            && this.options?.disableLinkOpened === true;
    }

    public enable(): void {
        if (this.isDisabled()) {
            return;
        }

        this.trackStructuredData();
        this.tab.addListener('urlChange', this.handleUrlChange);

        this.observer = new MutationObserver(this.handleMutations);
        this.observer.observe(document, {childList: true, subtree: true});

        window.addEventListener('pageshow', this.handlePageShow);

        if (this.options?.disableLinkOpened !== true) {
            document.addEventListener('click', this.trackLinkOpened, true);
        }
    }

    public disable(): void {
        this.observer?.disconnect();
        this.observer = null;
        this.trackedEntities.clear();

        this.tab.removeListener('urlChange', this.handleUrlChange);

        window.removeEventListener('pageshow', this.handlePageShow);
        document.removeEventListener('click', this.trackLinkOpened, true);
    }

    private handleMutations(mutations: MutationRecord[]): void {
        if (this.scanScheduled) {
            return;
        }

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) {
                    continue;
                }

                if (
                    AutoTrackingPlugin.isJsonLdScript(node)
                    || node.querySelector('script[type="application/ld+json"]') !== null
                ) {
                    this.scheduleScan();

                    return;
                }
            }
        }
    }

    /**
     * Defers the scan to a microtask to coalesce multiple DOM mutations
     * into a single scan. Frameworks like Next.js can insert several nodes
     * in quick succession during a route transition, each triggering the
     * MutationObserver. Without batching, each mutation would cause a
     * redundant full-document querySelectorAll for JSON-LD scripts.
     */
    private scheduleScan(): void {
        this.scanScheduled = true;

        queueMicrotask(() => {
            this.scanScheduled = false;
            this.trackStructuredData();
        });
    }

    private handleUrlChange(): void {
        this.trackedEntities.clear();
    }

    private handlePageShow(event: PageTransitionEvent): void {
        if (event.persisted) {
            this.trackedEntities.clear();
            this.trackStructuredData();
        }
    }

    private static isJsonLdScript(node: Element): boolean {
        return node.tagName === 'SCRIPT' && node.getAttribute('type') === 'application/ld+json';
    }

    private trackStructuredData(): void {
        const structuredDataElements = document.querySelectorAll('script[type="application/ld+json"]');

        for (const element of structuredDataElements) {
            const entity = parseEntity(element.textContent ?? '');

            switch (entity?.type) {
                case 'post':
                    if (this.options?.disablePostViewed !== true) {
                        this.trackPostViewed(entity);
                    }

                    break;

                case 'product':
                case 'service':
                    if (this.options?.disableProductViewed !== true) {
                        this.trackProductViewed(entity);
                    }

                    break;
            }
        }
    }

    private trackPostViewed(info: ArticleEntity): void {
        let postId = info.id;

        if (postId === undefined && info.url !== undefined) {
            const parsedUrl = new URL(info.url);
            const pathSegments = parsedUrl.pathname
                .split('/')
                .filter(segment => segment.length > 0);

            if (pathSegments.length > 0) {
                postId = pathSegments[pathSegments.length - 1];
            }
        }

        if (postId === undefined || info.title === undefined) {
            return;
        }

        const fingerprint = `post:${postId}`;

        if (this.trackedEntities.has(fingerprint)) {
            return;
        }

        this.trackedEntities.add(fingerprint);

        this.tracker.track('postViewed', {
            post: AutoTrackingPlugin.clean({
                postId: AutoTrackingPlugin.truncate(postId, 200),
                title: AutoTrackingPlugin.truncate(info.title, 200),
                url: info.url,
                tags: info.tags?.map(tag => AutoTrackingPlugin.truncate(tag, 50)),
                categories: info.categories?.map(category => AutoTrackingPlugin.truncate(category, 50)),
                authors: info.authors?.map(author => AutoTrackingPlugin.truncate(author, 100)),
                publishTime: info.publishTime ?? Date.now(),
                updateTime: info.updateTime,
            }),
        });
    }

    private trackProductViewed(info: ProductEntity): void {
        if (info.id === undefined || info.name === undefined || info.displayPrice === undefined) {
            return;
        }

        const fingerprint = `product:${info.id}`;

        if (this.trackedEntities.has(fingerprint)) {
            return;
        }

        this.trackedEntities.add(fingerprint);

        this.tracker.track('productViewed', {
            product: AutoTrackingPlugin.clean({
                productId: AutoTrackingPlugin.truncate(info.id, 50),
                name: AutoTrackingPlugin.truncate(info.name, 200),
                displayPrice: info.displayPrice,
                url: info.url,
                sku: info.sku !== undefined ? AutoTrackingPlugin.truncate(info.sku, 50) : undefined,
                brand: info.brand !== undefined ? AutoTrackingPlugin.truncate(info.brand, 100) : undefined,
                variant: info.variant !== undefined ? AutoTrackingPlugin.truncate(info.variant, 50) : undefined,
                category: info.category !== undefined ? AutoTrackingPlugin.truncate(info.category, 100) : undefined,
                originalPrice: info.originalPrice,
                imageUrl: info.imageUrl,
            }),
        });
    }

    private trackLinkOpened(event: MouseEvent): void {
        if (event.target instanceof HTMLElement) {
            const link = event.target.closest('a');

            if (link?.href !== undefined && URL.canParse(link.href, document.baseURI)) {
                this.tracker.track('linkOpened', {
                    link: new URL(link.href, document.baseURI).toString(),
                });
            }
        }
    }

    private static truncate(value: string, maxLength: number): string {
        if (value.length <= maxLength) {
            return value;
        }

        return value.slice(0, maxLength);
    }

    private static clean<T extends Record<string, unknown>>(obj: T): T {
        const result: T = {...obj};

        for (const key of Object.keys(result)) {
            if (result[key] === undefined) {
                delete result[key];
            }
        }

        return result;
    }
}

export const factory = ((props): AutoTrackingPlugin => new AutoTrackingPlugin({
    tab: props.sdk.tab,
    tracker: props.sdk.tracker,
    options: props.options,
})) satisfies PluginFactory<Options>;
