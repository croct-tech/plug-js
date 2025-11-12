import {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
import {Tab} from '@croct/sdk/tab';
import {Plugin, PluginFactory} from '../../plugin';
import {parseEntity, ArticleEntity, ProductEntity} from './structuredData';

export type Configuration = {
    tab: Tab,
    tracker: TrackerFacade,
    options?: Options,
};

export class AutoTrackingPlugin implements Plugin {
    private readonly tab: Tab;

    private readonly tracker: TrackerFacade;

    private readonly options?: Options;

    public constructor(configuration: Configuration) {
        this.tab = configuration.tab;
        this.tracker = configuration.tracker;
        this.options = configuration.options;
        this.track = this.track.bind(this);
    }

    private isDisabled(): boolean {
        return this.options?.disablePostViewed === true
            && this.options?.disableProductViewed === true;
    }

    public enable(): Promise<void> | void {
        if (this.isDisabled()) {
            return;
        }

        this.track();
        this.tab.addListener('urlChange', this.track);
    }

    public disable(): Promise<void> | void {
        this.tab.removeListener('urlChange', this.track);
    }

    private track(): void {
        const structuredDataElements = document.querySelectorAll('script[type="application/ld+json"]');

        for (const element of structuredDataElements) {
            const entity = parseEntity(element.textContent ?? '');

            switch (entity?.type) {
                case 'article':
                    if (this.options?.disablePostViewed !== true) {
                        this.trackPostViewed(entity);
                    }

                    break;

                case 'product':
                    if (this.options?.disableProductViewed !== true) {
                        this.trackProductViewed(entity);
                    }

                    break;
            }
        }
    }

    private trackPostViewed(info: ArticleEntity): void {
        this.tracker.track('postViewed', {
            post: {
                postId: AutoTrackingPlugin.truncate(info.postId, 200),
                title: AutoTrackingPlugin.truncate(info.title, 200),
                url: info.url,
                tags: info.tags?.map(tag => AutoTrackingPlugin.truncate(tag, 50)),
                categories: info.categories?.map(category => AutoTrackingPlugin.truncate(category, 50)),
                authors: info.authors?.map(author => AutoTrackingPlugin.truncate(author, 100)),
                publishTime: info.publishTime ?? Date.now(),
                updateTime: info.updateTime,
            },
        });
    }

    private trackProductViewed(info: ProductEntity): void {
        this.tracker.track('productViewed', {
            product: {
                productId: AutoTrackingPlugin.truncate(info.productId, 50),
                name: AutoTrackingPlugin.truncate(info.name, 200),
                displayPrice: info.displayPrice,
                url: info.url,
                sku: info.sku !== undefined ? AutoTrackingPlugin.truncate(info.sku, 50) : undefined,
                brand: info.brand !== undefined ? AutoTrackingPlugin.truncate(info.brand, 100) : undefined,
                variant: info.variant !== undefined ? AutoTrackingPlugin.truncate(info.variant, 50) : undefined,
                category: info.category !== undefined ? AutoTrackingPlugin.truncate(info.category, 100) : undefined,
                originalPrice: info.originalPrice !== undefined ? info.originalPrice : undefined,
                imageUrl: info.imageUrl !== undefined ? info.imageUrl : undefined,
            },
        });
    }

    private static truncate(value: string, maxLength: number): string {
        if (value.length <= maxLength) {
            return value;
        }

        return value.slice(0, maxLength);
    }
}

export type Options = {
    disablePostViewed?: boolean,
    disableProductViewed?: boolean,
};

export const factory: PluginFactory<Options> = (props): AutoTrackingPlugin => new AutoTrackingPlugin({
    tab: props.sdk.tab,
    tracker: props.sdk.tracker,
});
