import {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
import {Tab} from '@croct/sdk/tab';
import {Article, Product} from 'schema-dts';
import {AutoTrackingPlugin, Configuration, factory} from '../../../src/plugins/autoTracking';
import {PluginSdk} from '../../../src/plugin';
import mocked = jest.mocked;

describe('AutoTrackingPlugin factory', () => {
    it('should instantiate the AutoTrackingPlugin', () => {
        const mockTab: Partial<Tab> = {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        };

        const mockTracker: Partial<TrackerFacade> = {
            track: jest.fn(),
        };

        const sdk: Partial<PluginSdk> = {
            tab: mockTab as Tab,
            tracker: mockTracker as TrackerFacade,
        };

        const plugin = factory({
            sdk: sdk as PluginSdk,
            options: {},
        });

        expect(plugin).toBeInstanceOf(AutoTrackingPlugin);
    });
});

describe('AutoTrackingPlugin', () => {
    let mockTab: jest.Mocked<Tab>;
    let mockTracker: jest.Mocked<TrackerFacade>;
    let plugin: AutoTrackingPlugin;
    const now = Date.now();

    beforeEach(() => {
        // Clear the DOM before each test
        document.body.innerHTML = '';

        mockTab = {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        } as any;

        mockTracker = {
            track: jest.fn(),
        } as any;

        jest.spyOn(Date, 'now').mockReturnValue(now);

        URL.canParse = (input: string): boolean => {
            try {
                return new URL(input) instanceof URL;
            } catch {
                return false;
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should track immediately on enable', () => {
        const articleScript = document.createElement('script');

        const article = {
            '@type': 'Article',
            identifier: 'article-123',
            headline: 'Test Article',
            datePublished: '2024-01-01T00:00:00Z',
        } satisfies Article;

        articleScript.type = 'application/ld+json';
        articleScript.textContent = JSON.stringify(article);

        document.body.appendChild(articleScript);

        const configuration: Configuration = {
            tab: mockTab,
            tracker: mockTracker,
        };

        plugin = new AutoTrackingPlugin(configuration);
        plugin.enable();

        expect(mockTracker.track).toHaveBeenCalledWith('postViewed', {
            post: expect.objectContaining({
                postId: 'article-123',
                title: 'Test Article',
                publishTime: Date.parse(article.datePublished),
            }),
        });
    });

    it('should not track when both tracking types are disabled', () => {
        const articleScript = document.createElement('script');

        articleScript.type = 'application/ld+json';

        articleScript.textContent = JSON.stringify({
            '@type': 'Article',
            identifier: 'article-123',
            headline: 'Test Article',
            datePublished: '2024-01-01T00:00:00Z',
        } satisfies Article);

        document.body.appendChild(articleScript);

        const configuration: Configuration = {
            tab: mockTab,
            tracker: mockTracker,
            options: {
                disablePostViewed: true,
                disableProductViewed: true,
            } satisfies Required<Configuration['options']>,
        };

        plugin = new AutoTrackingPlugin(configuration);
        plugin.enable();

        expect(mockTab.addListener).not.toHaveBeenCalled();
        expect(mockTracker.track).not.toHaveBeenCalled();
    });

    it('should clean up listener on disable', () => {
        const configuration: Configuration = {
            tab: mockTab,
            tracker: mockTracker,
        };

        plugin = new AutoTrackingPlugin(configuration);
        plugin.enable();
        plugin.disable();

        expect(mockTab.removeListener).toHaveBeenCalledWith('urlChange', expect.any(Function));

        const addedListener = mocked(mockTab.addListener).mock.calls[0][1];
        const removedListener = mocked(mockTab.removeListener).mock.calls[0][1];

        expect(addedListener).toBe(removedListener);
    });

    it('should track viewed posts', () => {
        const articleScript = document.createElement('script');

        const article = {
            '@type': 'Article',
            identifier: 'article-123',
            headline: 'Test Article',
            url: 'https://example.com/article',
            keywords: ['tag1', 'tag2'],
            articleSection: 'Technology',
            author: [
                {
                    '@type': 'Person',
                    name: 'John Doe',
                },
                {
                    '@type': 'Person',
                    name: 'Jane Smith',
                },
            ],
            datePublished: '2024-01-01T00:00:00Z',
            dateModified: '2024-01-02T00:00:00Z',
        } satisfies Article;

        articleScript.type = 'application/ld+json';
        articleScript.textContent = JSON.stringify(article);
        document.body.appendChild(articleScript);

        const configuration: Configuration = {
            tab: mockTab,
            tracker: mockTracker,
        };

        plugin = new AutoTrackingPlugin(configuration);
        plugin.enable();

        expect(mockTracker.track).toHaveBeenCalledWith('postViewed', {
            post: {
                postId: article.identifier,
                title: article.headline,
                url: article.url,
                tags: article.keywords,
                categories: [article.articleSection],
                authors: article.author.map(author => author.name),
                publishTime: Date.parse(article.datePublished),
                updateTime: Date.parse(article.dateModified),
            },
        });
    });

    it('should truncate post properties when exceeding limits', () => {
        const articleScript = document.createElement('script');

        const article = {
            '@type': 'Article',
            identifier: 'a'.repeat(300),
            headline: 'T'.repeat(300),
            keywords: ['t'.repeat(100), 'shortTag'],
            articleSection: 'c'.repeat(100),
            author: [
                {
                    '@type': 'Person',
                    name: 'a'.repeat(150),
                },
            ],
        } satisfies Article;

        articleScript.type = 'application/ld+json';

        articleScript.textContent = JSON.stringify(article);

        document.body.appendChild(articleScript);

        const configuration: Configuration = {
            tab: mockTab,
            tracker: mockTracker,
        };

        plugin = new AutoTrackingPlugin(configuration);
        plugin.enable();

        expect(mockTracker.track).toHaveBeenCalledWith('postViewed', {
            post: {
                postId: 'a'.repeat(200),
                title: 'T'.repeat(200),
                tags: ['t'.repeat(50), 'shortTag'],
                categories: ['c'.repeat(50)],
                authors: ['a'.repeat(100)],
                publishTime: now,
            },
        });
    });

    it('should track viewed products', () => {
        const productScript = document.createElement('script');

        const product = {
            '@type': 'Product',
            productID: 'prod-123',
            sku: 'SKU-123',
            name: 'Test Product',
            category: 'Electronics',
            brand: {
                '@type': 'Brand',
                name: 'TestBrand',
            },
            color: 'Red',
            size: 'Large',
            url: 'https://example.com/product',
            image: 'https://example.com/image.jpg',
            offers: [
                {
                    '@type': 'Offer',
                    price: 99.99,
                },
                {
                    '@type': 'Offer',
                    price: 119.99,
                },
            ],
        } satisfies Product;

        productScript.type = 'application/ld+json';
        productScript.textContent = JSON.stringify(product);

        document.body.appendChild(productScript);

        const configuration: Configuration = {
            tab: mockTab,
            tracker: mockTracker,
        };

        plugin = new AutoTrackingPlugin(configuration);
        plugin.enable();

        expect(mockTracker.track).toHaveBeenCalledWith('productViewed', {
            product: {
                productId: product.productID,
                sku: product.sku,
                name: product.name,
                category: product.category,
                brand: product.brand.name,
                variant: [product.color, product.size].join(', '),
                displayPrice: 99.99,
                originalPrice: 119.99,
                url: product.url,
                imageUrl: product.image,
            },
        });
    });

    it('should truncate product properties when exceeding limits', () => {
        const productScript = document.createElement('script');

        const product = {
            '@type': 'Product',
            productID: 'p'.repeat(100),
            sku: 's'.repeat(100),
            name: 'n'.repeat(300),
            category: 'c'.repeat(200),
            brand: 'b'.repeat(150),
            url: 'https://example.com/product',
            offers: {
                '@type': 'Offer',
                price: 49.99,
            },
        } satisfies Product;

        productScript.type = 'application/ld+json';
        productScript.textContent = JSON.stringify(product);

        document.body.appendChild(productScript);

        const configuration: Configuration = {
            tab: mockTab,
            tracker: mockTracker,
        };

        plugin = new AutoTrackingPlugin(configuration);
        plugin.enable();

        expect(mockTracker.track).toHaveBeenCalledWith('productViewed', {
            product: {
                productId: 'p'.repeat(50),
                sku: 's'.repeat(50),
                name: 'n'.repeat(200),
                category: 'c'.repeat(100),
                brand: 'b'.repeat(100),
                displayPrice: 49.99,
                url: product.url,
            },
        });
    });
});
