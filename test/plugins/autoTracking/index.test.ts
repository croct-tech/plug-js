import {TrackerFacade} from '@croct/sdk/facade/trackerFacade';
import {Tab, TabUrlChangeEvent} from '@croct/sdk/tab';
import {Article, Product, Service} from 'schema-dts';
import {EventListener} from '@croct/sdk/eventManager';
import {Configuration, Options, factory, type AutoTrackingPlugin} from '../../../src/plugins/autoTracking';
import {PluginArguments, PluginSdk} from '../../../src/plugin';
import mocked = jest.mocked;

function flushMutationObserver(): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, 0);
    });
}

describe('AutoTrackingPlugin', () => {
    let mockTab: jest.Mocked<Tab>;
    let mockTracker: jest.Mocked<TrackerFacade>;
    const now = Date.now();

    beforeEach(() => {
        // Clear the DOM before each test
        document.body.innerHTML = '';

        mockTab = {addListener: jest.fn(), removeListener: jest.fn()} as unknown as jest.Mocked<Tab>;

        mockTracker = {track: jest.fn()} as unknown as jest.Mocked<TrackerFacade>;

        jest.spyOn(Date, 'now').mockReturnValue(now);

        URL.canParse = (input: string): boolean => {
            try {
                return new URL(input) instanceof URL;
            } catch {
                return false;
            }
        };
    });

    function createPlugin(options: Options = {}): AutoTrackingPlugin {
        const sdk: Partial<PluginSdk> = {
            tab: mockTab as Tab,
            tracker: mockTracker as TrackerFacade,
        };

        return factory({
            sdk: sdk as PluginSdk,
            options: options,
        });
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should track immediately on enable', () => {
        const articleScript = document.createElement('script');

        const article = {
            '@type': 'BlogPosting',
            identifier: 'article-123',
            headline: 'Test Article',
            datePublished: '2024-01-01T00:00:00Z',
        } satisfies Article;

        articleScript.type = 'application/ld+json';
        articleScript.textContent = JSON.stringify(article);

        document.body.appendChild(articleScript);

        const sdk: Partial<PluginSdk> = {
            tab: mockTab,
            tracker: mockTracker,
        };

        // Spy constructor
        const options: PluginArguments<Options> = {
            sdk: sdk as PluginSdk,
            options: {},
        };

        const plugin = factory(options);

        plugin.enable();

        expect(mockTracker.track).toHaveBeenCalled();

        const call = mockTracker.track
            .mock
            .calls
            .find(args => args[0] === 'postViewed');

        expect(call?.[1]).toStrictEqual({
            post: {
                postId: 'article-123',
                title: 'Test Article',
                publishTime: Date.parse(article.datePublished),
            },
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

        const plugin = createPlugin(
            {
                disablePostViewed: true,
                disableProductViewed: true,
                disableLinkOpened: true,
            } satisfies Required<Configuration['options']>,
        );

        plugin.enable();

        expect(mockTab.addListener).not.toHaveBeenCalled();
        expect(mockTracker.track).not.toHaveBeenCalled();
    });

    it('should clean up listener on disable', () => {
        jest.spyOn(document, 'addEventListener');
        jest.spyOn(document, 'removeEventListener');
        jest.spyOn(window, 'addEventListener');
        jest.spyOn(window, 'removeEventListener');

        const plugin = createPlugin();

        plugin.enable();
        plugin.disable();

        expect(mockTab.removeListener).toHaveBeenCalledWith('urlChange', expect.any(Function));

        const addedTabListener = mocked(mockTab.addListener).mock.calls[0][1];
        const removedTabListener = mocked(mockTab.removeListener).mock.calls[0][1];

        expect(addedTabListener).toBe(removedTabListener);

        expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);

        const addedClickListener = mocked(document.addEventListener)
            .mock
            .calls
            .find(call => call[0] === 'click')![1];

        const removedClickListener = mocked(document.removeEventListener)
            .mock
            .calls
            .find(call => call[0] === 'click')![1];

        expect(addedClickListener).toBe(removedClickListener);

        const addedPageShowListener = mocked(window.addEventListener)
            .mock
            .calls
            .find(call => call[0] === 'pageshow')![1];

        const removedPageShowListener = mocked(window.removeEventListener)
            .mock
            .calls
            .find(call => call[0] === 'pageshow')![1];

        expect(addedPageShowListener).toBe(removedPageShowListener);
    });

    describe('Post view tracking', () => {
        it('should track viewed posts', () => {
            const articleScript = document.createElement('script');

            const article = {
                '@type': 'BlogPosting',
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

            const plugin = createPlugin();

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

        it('should extract ID from URL if identifier is missing', () => {
            const articleScript = document.createElement('script');

            const article = {
                '@type': 'BlogPosting',
                headline: 'Test Article',
                url: 'https://example.com/articles/article-456',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            articleScript.type = 'application/ld+json';

            articleScript.textContent = JSON.stringify(article);

            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalledWith('postViewed', {
                post: {
                    postId: 'article-456',
                    title: article.headline,
                    url: article.url,
                    publishTime: Date.parse(article.datePublished),

                },
            });
        });

        it('should not track if no slug can be extracted from URL and identifier is missing', () => {
            const articleScript = document.createElement('script');

            const article = {
                '@type': 'BlogPosting',
                headline: 'Test Article',
                url: 'https://example.com/',
            } satisfies Article;

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);

            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();
        });

        it('should not track post if the title is missing', () => {
            const articleScript = document.createElement('script');

            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                url: 'https://example.com/article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);

            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();
        });

        it('should not track general articles', () => {
            const articleScript = document.createElement('script');

            const article = {
                '@type': 'Article',
                identifier: 'article-123',
                headline: 'Test Article',
                url: 'https://example.com/article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);

            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();
        });

        it('should truncate post properties when exceeding limits', () => {
            const articleScript = document.createElement('script');

            const article = {
                '@type': 'BlogPosting',
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

            const plugin = createPlugin();

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

        it('should track posts when JSON-LD is added to DOM after enable', async () => {
            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                url: 'https://example.com/article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();

            const articleScript = document.createElement('script');

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);
            document.body.appendChild(articleScript);

            await flushMutationObserver();

            expect(mockTracker.track).toHaveBeenCalledWith('postViewed', {
                post: {
                    postId: article.identifier,
                    title: article.headline,
                    url: article.url,
                    publishTime: Date.parse(article.datePublished),
                },
            });
        });
    });

    describe('Product view tracking', () => {
        it('should track viewed products', () => {
            const productScript = document.createElement('script');

            const product = {
                '@type': 'Product',
                productID: 'prod-123',
                name: 'Test Product',
                url: 'https://example.com/product',
                offers: {
                    '@type': 'Offer',
                    price: 99.99,
                },
            } satisfies Product;

            productScript.type = 'application/ld+json';
            productScript.textContent = JSON.stringify(product);

            document.body.appendChild(productScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalled();

            const call = mockTracker.track
                .mock
                .calls
                .find(args => args[0] === 'productViewed');

            expect(call?.[1]).toStrictEqual({
                product: {
                    productId: product.productID,
                    name: product.name,
                    url: product.url,
                    displayPrice: 99.99,
                },
            });
        });

        it('should track viewed services', () => {
            const productScript = document.createElement('script');

            const product = {
                '@type': 'Service',
                identifier: 'serv-456',
                name: 'Test Service',
                url: 'https://example.com/service',
                offers: {
                    '@type': 'Offer',
                    price: 199.99,
                },
            } satisfies Service;

            productScript.type = 'application/ld+json';
            productScript.textContent = JSON.stringify(product);

            document.body.appendChild(productScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalledWith('productViewed', {
                product: {
                    productId: product.identifier,
                    name: product.name,
                    displayPrice: 199.99,
                    url: product.url,
                },
            });
        });

        it('should not track product if ID is missing', () => {
            const productScript = document.createElement('script');

            const product = {
                '@type': 'Product',
                name: 'Test Product',
                url: 'https://example.com/product',
                offers: {
                    '@type': 'Offer',
                    price: 49.99,
                },
            } satisfies Product;

            productScript.type = 'application/ld+json';
            productScript.textContent = JSON.stringify(product);

            document.body.appendChild(productScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();
        });

        it('should not track product if name is missing', () => {
            const productScript = document.createElement('script');

            const product = {
                '@type': 'Product',
                productID: 'prod-123',
                url: 'https://example.com/product',
                offers: {
                    '@type': 'Offer',
                    price: 49.99,
                },
            } satisfies Product;

            productScript.type = 'application/ld+json';
            productScript.textContent = JSON.stringify(product);

            document.body.appendChild(productScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();
        });

        it('should not track product if price is missing', () => {
            const productScript = document.createElement('script');

            const product = {
                '@type': 'Product',
                productID: 'prod-123',
                name: 'Test Product',
                url: 'https://example.com/product',
            } satisfies Product;

            productScript.type = 'application/ld+json';
            productScript.textContent = JSON.stringify(product);

            document.body.appendChild(productScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();
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

            const plugin = createPlugin();

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

        it('should track products when JSON-LD is added to DOM after enable', async () => {
            const product = {
                '@type': 'Product',
                productID: 'prod-123',
                sku: 'SKU-123',
                name: 'Test Product',
                brand: 'TestBrand',
                url: 'https://example.com/product',
                offers: {
                    '@type': 'Offer',
                    price: 99.99,
                },
            } satisfies Product;

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).not.toHaveBeenCalled();

            const productScript = document.createElement('script');

            productScript.type = 'application/ld+json';
            productScript.textContent = JSON.stringify(product);
            document.body.appendChild(productScript);

            await flushMutationObserver();

            expect(mockTracker.track).toHaveBeenCalledWith('productViewed', {
                product: {
                    productId: product.productID,
                    sku: product.sku,
                    name: product.name,
                    brand: product.brand,
                    displayPrice: 99.99,
                    url: product.url,
                },
            });
        });
    });

    describe('Deduplication', () => {
        it('should not re-track the same post on the same page visit', async () => {
            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const articleScript = document.createElement('script');

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);
            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalledTimes(1);

            // Add another script with the same entity
            const duplicateScript = document.createElement('script');

            duplicateScript.type = 'application/ld+json';
            duplicateScript.textContent = JSON.stringify(article);
            document.body.appendChild(duplicateScript);

            await flushMutationObserver();

            expect(mockTracker.track).toHaveBeenCalledTimes(1);
        });

        it('should not re-track the same product on the same page visit', async () => {
            const product = {
                '@type': 'Product',
                productID: 'prod-123',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 99.99,
                },
            } satisfies Product;

            const productScript = document.createElement('script');

            productScript.type = 'application/ld+json';
            productScript.textContent = JSON.stringify(product);
            document.body.appendChild(productScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalledTimes(1);

            const duplicateScript = document.createElement('script');

            duplicateScript.type = 'application/ld+json';
            duplicateScript.textContent = JSON.stringify(product);
            document.body.appendChild(duplicateScript);

            await flushMutationObserver();

            expect(mockTracker.track).toHaveBeenCalledTimes(1);
        });

        it('should re-track entities after URL change and new DOM content', async () => {
            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const articleScript = document.createElement('script');

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);
            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalledTimes(1);

            // Simulate URL change (clears dedup set)
            const urlChangeListener: EventListener<TabUrlChangeEvent> = mocked(mockTab.addListener)
                .mock
                .calls
                .find(call => call[0] === 'urlChange')![1];

            urlChangeListener(
                new CustomEvent('urlChange', {
                    detail: {
                        tab: mockTab,
                        url: 'https://example.com/new-page',
                    },
                }),
            );

            // Add the same entity again (simulating framework re-render)
            const newScript = document.createElement('script');

            newScript.type = 'application/ld+json';
            newScript.textContent = JSON.stringify(article);
            document.body.appendChild(newScript);

            await flushMutationObserver();

            expect(mockTracker.track).toHaveBeenCalledTimes(2);
        });
    });

    describe('URL change handling', () => {
        it('should not scan DOM on urlChange', () => {
            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const articleScript = document.createElement('script');

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);
            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            mockTracker.track.mockClear();

            // Trigger URL change — should NOT re-scan DOM
            const urlChangeListener: EventListener<TabUrlChangeEvent> = mocked(mockTab.addListener)
                .mock
                .calls
                .find(call => call[0] === 'urlChange')![1];

            urlChangeListener(
                new CustomEvent('urlChange', {
                    detail: {
                        tab: mockTab,
                        url: 'https://example.com/new-page',
                    },
                }),
            );

            expect(mockTracker.track).not.toHaveBeenCalled();
        });
    });

    describe('bfcache restoration', () => {
        it('should re-track entities on bfcache restoration', () => {
            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const articleScript = document.createElement('script');

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);
            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalledTimes(1);

            // Simulate bfcache restoration
            const pageshowEvent = new PageTransitionEvent('pageshow', {persisted: true});

            window.dispatchEvent(pageshowEvent);

            expect(mockTracker.track).toHaveBeenCalledTimes(2);
        });

        it('should not re-scan on regular pageshow', () => {
            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const articleScript = document.createElement('script');

            articleScript.type = 'application/ld+json';
            articleScript.textContent = JSON.stringify(article);
            document.body.appendChild(articleScript);

            const plugin = createPlugin();

            plugin.enable();

            expect(mockTracker.track).toHaveBeenCalledTimes(1);

            const pageshowEvent = new PageTransitionEvent('pageshow', {persisted: false});

            window.dispatchEvent(pageshowEvent);

            expect(mockTracker.track).toHaveBeenCalledTimes(1);
        });
    });

    describe('MutationObserver', () => {
        it('should detect deeply nested JSON-LD additions', async () => {
            const plugin = createPlugin();

            plugin.enable();

            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const wrapper = document.createElement('div');
            const inner = document.createElement('div');
            const script = document.createElement('script');

            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(article);

            inner.appendChild(script);
            wrapper.appendChild(inner);
            document.body.appendChild(wrapper);

            await flushMutationObserver();

            expect(mockTracker.track).toHaveBeenCalledWith('postViewed', expect.objectContaining({
                post: expect.objectContaining({
                    postId: 'article-123',
                }),
            }));
        });

        it('should disconnect on disable', async () => {
            const plugin = createPlugin();

            plugin.enable();

            plugin.disable();

            const article = {
                '@type': 'BlogPosting',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-01T00:00:00Z',
            } satisfies Article;

            const script = document.createElement('script');

            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(article);
            document.body.appendChild(script);

            await flushMutationObserver();

            expect(mockTracker.track).not.toHaveBeenCalled();
        });
    });

    describe('Link tracking', () => {
        it('should track when a link is clicked', () => {
            const plugin = createPlugin();

            plugin.enable();

            const link = document.createElement('a');

            link.href = 'https://example.com/page';
            document.body.appendChild(link);

            link.click();

            expect(mockTracker.track).toHaveBeenCalledWith('linkOpened', {
                link: 'https://example.com/page',
            });
        });

        it('should track when a child element of a link is clicked', () => {
            const plugin = createPlugin();

            plugin.enable();

            const link = document.createElement('a');

            link.href = 'https://example.com/page';

            const span = document.createElement('span');

            span.textContent = 'Click me';
            link.appendChild(span);

            document.body.appendChild(link);

            span.click();

            expect(mockTracker.track).toHaveBeenCalledWith('linkOpened', {
                link: 'https://example.com/page',
            });
        });

        it('should track when a deeply nested child element of a link is clicked', () => {
            const plugin = createPlugin();

            plugin.enable();

            const link = document.createElement('a');

            link.href = 'https://example.com/nested';

            const div = document.createElement('div');
            const span = document.createElement('span');
            const button = document.createElement('button');

            button.textContent = 'Click me';

            span.appendChild(button);
            div.appendChild(span);
            link.appendChild(div);
            document.body.appendChild(link);

            button.click();

            expect(mockTracker.track).toHaveBeenCalledWith('linkOpened', {
                link: 'https://example.com/nested',
            });
        });

        it('should not track when a non-link element is clicked', () => {
            const plugin = createPlugin();

            plugin.enable();

            const button = document.createElement('button');

            button.textContent = 'Not a link';
            document.body.appendChild(button);

            button.click();

            expect(mockTracker.track).not.toHaveBeenCalledWith('linkOpened', expect.anything());
        });

        it('should not track when link has no href', () => {
            const plugin = createPlugin();

            plugin.enable();

            const link = document.createElement('a');

            document.body.appendChild(link);

            link.click();

            expect(mockTracker.track).not.toHaveBeenCalledWith('linkOpened', expect.anything());
        });

        it('should track relative URLs', () => {
            const plugin = createPlugin();

            plugin.enable();

            const link = document.createElement('a');

            link.href = '/relative/path#section';
            document.body.appendChild(link);

            link.click();

            // The browser resolves relative URLs to absolute URLs
            expect(mockTracker.track).toHaveBeenCalledWith('linkOpened', {
                link: new URL(link.href, document.baseURI).toString(),
            });
        });

        it('should use capture phase for event listening', () => {
            const plugin = createPlugin();

            plugin.enable();

            const link = document.createElement('a');

            link.href = 'https://example.com/capture';

            link.addEventListener('click', event => {
                event.stopImmediatePropagation();
            });

            document.body.appendChild(link);

            link.click();

            expect(mockTracker.track).toHaveBeenCalledWith('linkOpened', {
                link: 'https://example.com/capture',
            });
        });
    });
});
