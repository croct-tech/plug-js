/**
 * @jest-environment node
 */

import {Article, Organization, Product} from 'schema-dts';
import {
    ArticleEntity,
    extractArticle,
    extractProduct,
    ProductEntity,
    parseEntity,
    extractEntity,
    Entity,
} from '../../../src/plugins/autoTracking/structuredData';

describe('parseEntity', () => {
    type EntityScenario = {
        description: string,
        content: string,
        expected: Entity | null,
    };

    it.each<EntityScenario>([
        {
            description: 'invalid JSON string',
            content: 'not valid json {',
            expected: null,
        },
        {
            description: 'empty string',
            content: '',
            expected: null,
        },
        {
            description: 'JSON primitive instead of object',
            content: JSON.stringify('just a string'),
            expected: null,
        },
        {
            description: 'JSON null',
            content: 'null',
            expected: null,
        },
        {
            description: 'valid article JSON-LD string',
            content: JSON.stringify({
                '@type': 'Article',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            } satisfies Article),
            expected: {
                type: 'article',
                postId: 'article-123',
                title: 'Test Article',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'valid product JSON-LD string',
            content: JSON.stringify({
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 99.99,
                },
            } satisfies Product),
            expected: {
                type: 'product',
                productId: '12345',
                name: 'Test Product',
                displayPrice: 99.99,
            },
        },
        {
            description: 'JSON array instead of object',
            content: JSON.stringify([
                {
                    '@type': 'Article',
                    identifier: 'article-123',
                    headline: 'Test Article',
                    datePublished: '2024-01-15T08:00:00Z',
                } satisfies Article,
            ]),
            expected: null,
        },
        {
            description: 'BlogPosting with all fields',
            content: JSON.stringify({
                '@type': 'BlogPosting',
                identifier: 'blog-post-123',
                headline: 'My Blog Post',
                datePublished: '2024-01-15T08:00:00Z',
                url: 'https://blog.example.com/my-post',
                keywords: ['tech', 'tutorial'],
                articleSection: 'Technology',
                author: {
                    '@type': 'Person',
                    name: 'John Doe',
                },
            } satisfies Article),
            expected: {
                type: 'article',
                postId: 'blog-post-123',
                title: 'My Blog Post',
                publishTime: 1705305600000,
                url: 'https://blog.example.com/my-post',
                tags: ['tech', 'tutorial'],
                categories: ['Technology'],
                authors: ['John Doe'],
            },
        },
        {
            description: 'Product with all fields',
            content: JSON.stringify({
                '@type': 'Product',
                productID: 'PROD-001',
                sku: 'SKU-001',
                name: 'Nike Shoes',
                brand: 'Nike',
                category: 'Footwear',
                color: 'Red',
                size: '10',
                url: 'https://shop.example.com/nike-shoes',
                image: 'https://shop.example.com/images/nike.jpg',
                offers: [
                    {
                        '@type': 'Offer',
                        price: 129.99,
                    },
                    {
                        '@type': 'Offer',
                        price: 149.99,
                    },
                ],
            } satisfies Product),
            expected: {
                type: 'product',
                productId: 'PROD-001',
                sku: 'SKU-001',
                name: 'Nike Shoes',
                brand: 'Nike',
                category: 'Footwear',
                variant: 'Red, 10',
                displayPrice: 129.99,
                originalPrice: 149.99,
                url: 'https://shop.example.com/nike-shoes',
                imageUrl: 'https://shop.example.com/images/nike.jpg',
            },
        },
    ])('should parse $description', ({content, expected}) => {
        expect(parseEntity(content)).toEqual(expected);
    });
});

describe('extractEntity', () => {
    type EntityScenario = {
        description: string,
        data: Article|Product|Organization,
        expected: Entity | null,
    };

    it.each<EntityScenario>([
        {
            description: 'Article type',
            data: {
                '@type': 'Article',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'article-123',
                title: 'Test Article',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'NewsArticle type',
            data: {
                '@type': 'NewsArticle',
                identifier: 'news-123',
                headline: 'Breaking News',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'news-123',
                title: 'Breaking News',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'BlogPosting type',
            data: {
                '@type': 'BlogPosting',
                identifier: 'blog-123',
                headline: 'Blog Post',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'blog-123',
                title: 'Blog Post',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'Product type',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 99.99,
                },
            },
            expected: {
                type: 'product',
                productId: '12345',
                name: 'Test Product',
                displayPrice: 99.99,
            },
        },
        {
            description: 'ProductModel type',
            data: {
                '@type': 'ProductModel',
                productID: 'MODEL-123',
                name: 'Product Model',
                offers: {
                    '@type': 'Offer',
                    price: 199.99,
                },
            },
            expected: {
                type: 'product',
                productId: 'MODEL-123',
                name: 'Product Model',
                displayPrice: 199.99,
            },
        },
        {
            description: 'Vehicle type (product subtype)',
            data: {
                '@type': 'Vehicle',
                productID: 'CAR-123',
                name: 'Tesla Model 3',
                offers: {
                    '@type': 'Offer',
                    price: 45000,
                },
            },
            expected: {
                type: 'product',
                productId: 'CAR-123',
                name: 'Tesla Model 3',
                displayPrice: 45000,
            },
        },
        {
            description: 'unsupported type',
            data: {
                '@type': 'Organization',
                name: 'Company Name',
            },
            expected: null,
        },
        {
            description: 'missing @type',
            data: {
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            } as Article,
            expected: null,
        },
        {
            description: 'Article with invalid data (missing required fields)',
            data: {
                '@type': 'Article',
                identifier: 'article-123',
                // Missing headline and datePublished
            },
            expected: null,
        },
        {
            description: 'Product with invalid data (missing required fields)',
            data: {
                '@type': 'Product',
                productID: '12345',
                // Missing name and offers
            },
            expected: null,
        },
        {
            description: 'Product checked before Article when both match',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                headline: 'Should not be treated as article',
                datePublished: '2024-01-15T08:00:00Z',
                offers: {
                    '@type': 'Offer',
                    price: 99.99,
                },
            } as Product & Article,
            expected: {
                type: 'product',
                productId: '12345',
                name: 'Test Product',
                displayPrice: 99.99,
            },
        },
        {
            description: 'ScholarlyArticle type',
            data: {
                '@type': 'ScholarlyArticle',
                identifier: 'doi:10.1234/example',
                headline: 'Research Paper',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'doi:10.1234/example',
                title: 'Research Paper',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'TechArticle type',
            data: {
                '@type': 'TechArticle',
                identifier: 'tech-123',
                headline: 'Technical Guide',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'tech-123',
                title: 'Technical Guide',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'Report type',
            data: {
                '@type': 'Report',
                identifier: 'report-123',
                headline: 'Annual Report',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'report-123',
                title: 'Annual Report',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'SocialMediaPosting type',
            data: {
                '@type': 'SocialMediaPosting',
                identifier: 'post-123',
                headline: 'Social Post',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'post-123',
                title: 'Social Post',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'OpinionNewsArticle type',
            data: {
                '@type': 'OpinionNewsArticle',
                identifier: 'opinion-123',
                headline: 'My Opinion',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'opinion-123',
                title: 'My Opinion',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'ReviewNewsArticle type',
            data: {
                '@type': 'ReviewNewsArticle',
                identifier: 'review-123',
                headline: 'Product Review',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'review-123',
                title: 'Product Review',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'AnalysisNewsArticle type',
            data: {
                '@type': 'AnalysisNewsArticle',
                identifier: 'analysis-123',
                headline: 'Market Analysis',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'analysis-123',
                title: 'Market Analysis',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'BackgroundNewsArticle type',
            data: {
                '@type': 'BackgroundNewsArticle',
                identifier: 'background-123',
                headline: 'Background Story',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'background-123',
                title: 'Background Story',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'AdvertiserContentArticle type',
            data: {
                '@type': 'AdvertiserContentArticle',
                identifier: 'sponsored-123',
                headline: 'Sponsored Content',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'sponsored-123',
                title: 'Sponsored Content',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'SatiricalArticle type',
            data: {
                '@type': 'SatiricalArticle',
                identifier: 'satire-123',
                headline: 'Satirical Piece',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'satire-123',
                title: 'Satirical Piece',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'APIReference type',
            data: {
                '@type': 'APIReference',
                identifier: 'api-docs',
                headline: 'API Documentation',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'api-docs',
                title: 'API Documentation',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'DiscussionForumPosting type',
            data: {
                '@type': 'DiscussionForumPosting',
                identifier: 'forum-123',
                headline: 'Forum Discussion',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'forum-123',
                title: 'Forum Discussion',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'LiveBlogPosting type',
            data: {
                '@type': 'LiveBlogPosting',
                identifier: 'live-123',
                headline: 'Live Blog',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                type: 'article',
                postId: 'live-123',
                title: 'Live Blog',
                publishTime: 1705305600000,
            },
        },
        {
            description: 'ProductGroup type',
            data: {
                '@type': 'ProductGroup',
                productID: 'GROUP-123',
                name: 'Product Group',
                offers: {
                    '@type': 'Offer',
                    price: 299.99,
                },
            },
            expected: {
                type: 'product',
                productId: 'GROUP-123',
                name: 'Product Group',
                displayPrice: 299.99,
            },
        },
        {
            description: 'SomeProducts type',
            data: {
                '@type': 'SomeProducts',
                productID: 'SOME-123',
                name: 'Some Products',
                offers: {
                    '@type': 'Offer',
                    price: 399.99,
                },
            },
            expected: {
                type: 'product',
                productId: 'SOME-123',
                name: 'Some Products',
                displayPrice: 399.99,
            },
        },
        {
            description: 'Car type',
            data: {
                '@type': 'Car',
                productID: 'CAR-456',
                name: 'Honda Civic',
                offers: {
                    '@type': 'Offer',
                    price: 25000,
                },
            },
            expected: {
                type: 'product',
                productId: 'CAR-456',
                name: 'Honda Civic',
                displayPrice: 25000,
            },
        },
        {
            description: 'Motorcycle type',
            data: {
                '@type': 'Motorcycle',
                productID: 'MOTO-789',
                name: 'Harley Davidson',
                offers: {
                    '@type': 'Offer',
                    price: 15000,
                },
            },
            expected: {
                type: 'product',
                productId: 'MOTO-789',
                name: 'Harley Davidson',
                displayPrice: 15000,
            },
        },
        {
            description: 'IndividualProduct type',
            data: {
                '@type': 'IndividualProduct',
                productID: 'INDIVIDUAL-123',
                name: 'Individual Product',
                offers: {
                    '@type': 'Offer',
                    price: 599.99,
                },
            },
            expected: {
                type: 'product',
                productId: 'INDIVIDUAL-123',
                name: 'Individual Product',
                displayPrice: 599.99,
            },
        },
    ])('should extract $description', ({data, expected}) => {
        expect(extractEntity(data as any)).toEqual(expected);
    });
});

describe('extractProduct', () => {
    type ProductScenario = {
        description: string,
        data: Product,
        expected: ProductEntity | null,
    };

    it.each<ProductScenario>([
        {
            description: 'basic product with price',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 1,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 1,
            },
        },
        {
            description: 'product with SKU as productId',
            data: {
                '@type': 'Product',
                sku: 'SKU-001',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 99.99,
                },
            },
            expected: {
                productId: 'SKU-001',
                sku: 'SKU-001',
                name: 'Test Product',
                displayPrice: 99.99,
            },
        },
        {
            description: 'product with separate SKU and productID',
            data: {
                '@type': 'Product',
                productID: '12345',
                sku: 'SKU-001',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                sku: 'SKU-001',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'product with all optional fields',
            data: {
                '@type': 'Product',
                productID: '12345',
                sku: 'SKU-001',
                name: 'Test Product',
                category: 'Electronics',
                brand: 'TestBrand',
                url: 'https://example.com/product',
                image: 'https://example.com/image.jpg',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                    url: 'https://example.com/buy',
                },
            },
            expected: {
                productId: '12345',
                sku: 'SKU-001',
                name: 'Test Product',
                category: 'Electronics',
                brand: 'TestBrand',
                displayPrice: 100,
                url: 'https://example.com/product',
                imageUrl: 'https://example.com/image.jpg',
            },
        },
        {
            description: 'product with object category',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                category: {
                    '@type': 'Thing',
                    name: 'Electronics',
                },
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                category: 'Electronics',
                displayPrice: 100,
            },
        },
        {
            description: 'product with object brand',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                brand: {
                    '@type': 'Brand',
                    name: 'TestBrand',
                },
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                brand: 'TestBrand',
                displayPrice: 100,
            },
        },
        {
            description: 'product with color variant as string',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                color: 'Red',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Red',
                displayPrice: 100,
            },
        },
        {
            description: 'product with size variant as string',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                size: 'Large',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Large',
                displayPrice: 100,
            },
        },
        {
            description: 'product with size variant as object',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                size: {
                    '@type': 'QuantitativeValue',
                    name: 'Large',
                },
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Large',
                displayPrice: 100,
            },
        },
        {
            description: 'product with material variant as string',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                material: 'Cotton',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Cotton',
                displayPrice: 100,
            },
        },
        {
            description: 'product with material variant as object',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                material: {
                    '@type': 'Product',
                    name: 'Cotton',
                },
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Cotton',
                displayPrice: 100,
            },
        },
        {
            description: 'product with pattern variant as string',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                pattern: 'Striped',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Striped',
                displayPrice: 100,
            },
        },
        {
            description: 'product with pattern variant as object',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                pattern: {
                    '@type': 'DefinedTerm',
                    name: 'Striped',
                },
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Striped',
                displayPrice: 100,
            },
        },
        {
            description: 'product with model variant as string',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                model: 'Version 2',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Version 2',
                displayPrice: 100,
            },
        },
        {
            description: 'product with model variant as object',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                model: {
                    '@type': 'ProductModel',
                    name: 'Version 2',
                },
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Version 2',
                displayPrice: 100,
            },
        },
        {
            description: 'product with multiple variants',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                color: 'Red',
                size: 'Large',
                material: 'Cotton',
                pattern: 'Striped',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Red, Striped, Large, Cotton',
                displayPrice: 100,
            },
        },
        {
            description: 'product with array of offers',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: [
                    {
                        '@type': 'Offer',
                        price: 100,
                    },
                    {
                        '@type': 'Offer',
                        price: 90,
                    },
                ],
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 90,
                originalPrice: 100,
            },
        },
        {
            description: 'product with lowPrice and highPrice',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'AggregateOffer',
                    lowPrice: 50,
                    highPrice: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 50,
                originalPrice: 100,
            },
        },
        {
            description: 'product with priceSpecification',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 90,
                    priceSpecification: {
                        '@type': 'PriceSpecification',
                        price: 120,
                    },
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 90,
                originalPrice: 120,
            },
        },
        {
            description: 'product with array of priceSpecifications',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 90,
                    priceSpecification: [
                        {
                            '@type': 'PriceSpecification',
                            price: 120,
                        },
                        {
                            '@type': 'PriceSpecification',
                            minPrice: 100,
                            maxPrice: 150,
                        },
                    ],
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 90,
                originalPrice: 150,
            },
        },
        {
            description: 'product with price as string',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: '99.99',
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 99.99,
            },
        },
        {
            description: 'product with negative price filtered out',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: [
                    {
                        '@type': 'Offer',
                        price: -10,
                    },
                    {
                        '@type': 'Offer',
                        price: 100,
                    },
                ],
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'product with offer URL',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                    url: 'https://example.com/buy',
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
                url: 'https://example.com/buy',
            },
        },
        {
            description: 'product URL takes priority over offer URL',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                url: 'https://example.com/product',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                    url: 'https://example.com/buy',
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
                url: 'https://example.com/product',
            },
        },
        {
            description: 'product with invalid URL skipped',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                url: 'not-a-valid-url',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'product with image as string',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                image: 'https://example.com/image.jpg',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
                imageUrl: 'https://example.com/image.jpg',
            },
        },
        {
            description: 'product with image as object',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                image: {
                    '@type': 'ImageObject',
                    url: 'https://example.com/image.jpg',
                },
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
                imageUrl: 'https://example.com/image.jpg',
            },
        },
        {
            description: 'product with array of images',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                image: [
                    'https://example.com/image1.jpg',
                    'https://example.com/image2.jpg',
                ],
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
                imageUrl: 'https://example.com/image1.jpg',
            },
        },
        {
            description: 'product with invalid image URL skipped',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                image: 'not-a-valid-url',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'product with empty SKU ignored',
            data: {
                '@type': 'Product',
                productID: '12345',
                sku: '',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'product with whitespace-only SKU ignored',
            data: {
                '@type': 'Product',
                productID: '12345',
                sku: '   ',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'null for missing productId',
            data: {
                '@type': 'Product',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: null,
        },
        {
            description: 'null for missing name',
            data: {
                '@type': 'Product',
                productID: '12345',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: null,
        },
        {
            description: 'null for missing offers',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
            },
            expected: null,
        },
        {
            description: 'null for invalid offer',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: 'invalid' as any,
            },
            expected: null,
        },
        {
            description: 'null for offer without price',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                },
            },
            expected: null,
        },
        {
            description: 'null for non-numeric price',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 'invalid',
                },
            },
            expected: null,
        },
        {
            description: 'null for all negative prices',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: -100,
                },
            },
            expected: null,
        },
        {
            description: 'product with invalid priceSpecification ignored',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                    priceSpecification: 'invalid' as any,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'originalPrice not set when equal to displayPrice',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                offers: {
                    '@type': 'AggregateOffer',
                    price: 100,
                    lowPrice: 100,
                    highPrice: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                displayPrice: 100,
            },
        },
        {
            description: 'invalid product data returns null',
            data: {
                '@type': 'Product',
                offers: null as any,
            },
            expected: null,
        },
        {
            description: 'real-world product example',
            data: {
                '@type': 'Product',
                '@id': 'https://www.nike.com/t/air-max-90-mens-shoes-6n8tKB/CN8490-002',
                productID: 'CN8490-002',
                sku: 'CN8490-002-10',
                name: 'Nike Air Max 90',
                description: 'The Nike Air Max 90 stays true to its OG running roots...',
                category: {
                    '@type': 'Thing',
                    name: 'Athletic Shoes',
                },
                brand: {
                    '@type': 'Brand',
                    name: 'Nike',
                },
                color: 'Black/White',
                size: {
                    '@type': 'QuantitativeValue',
                    name: '10',
                    value: '10',
                    unitText: 'US',
                },
                material: 'Leather and synthetic',
                url: 'https://www.nike.com/t/air-max-90-mens-shoes-6n8tKB/CN8490-002',
                image: [
                    {
                        '@type': 'ImageObject',
                        url: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/CN8490-002-1.jpg',
                        contentUrl: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/CN8490-002-1.jpg',
                    },
                    'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/CN8490-002-2.jpg',
                    {
                        '@type': 'ImageObject',
                        url: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/CN8490-002-3.jpg',
                    },
                ],
                offers: {
                    '@type': 'Offer',
                    price: '129.99',
                    priceCurrency: 'USD',
                    availability: 'https://schema.org/InStock',
                    url: 'https://www.nike.com/cart/CN8490-002',
                    priceSpecification: {
                        '@type': 'PriceSpecification',
                        price: '149.99',
                        priceCurrency: 'USD',
                    },
                    seller: {
                        '@type': 'Organization',
                        name: 'Nike',
                    },
                },
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.5',
                    reviewCount: '2847',
                },
            },
            expected: {
                productId: 'CN8490-002',
                sku: 'CN8490-002-10',
                name: 'Nike Air Max 90',
                category: 'Athletic Shoes',
                brand: 'Nike',
                variant: 'Black/White, 10, Leather and synthetic',
                displayPrice: 129.99,
                originalPrice: 149.99,
                url: 'https://www.nike.com/t/air-max-90-mens-shoes-6n8tKB/CN8490-002',
                imageUrl: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/CN8490-002-1.jpg',
            },
        },
    ])('should extract $description', ({data, expected}) => {
        expect(extractProduct(data as any)).toEqual(expected);
    });
});

describe('extractArticle', () => {
    type ArticleScenario = {
        description: string,
        data: Article,
        expected: ArticleEntity | null,
    };

    it.each<ArticleScenario>([
        {
            description: 'basic Article with identifier',
            data: {
                '@type': 'Article',
                identifier: 'article-123',
                headline: 'Test Article',
                datePublished: '2017-07-12T12:00:00Z',
            },
            expected: {
                postId: 'article-123',
                title: 'Test Article',
                publishTime: Date.parse('2017-07-12T12:00:00Z'),
            },
        },
        {
            description: 'Article with URL slug extraction (simple path)',
            data: {
                '@type': 'Article',
                url: 'https://blog.example.com/my-article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://blog.example.com/my-article',
            },
        },
        {
            description: 'Article with URL slug extraction (nested path)',
            data: {
                '@type': 'Article',
                url: 'https://blog.example.com/posts/2024/my-article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://blog.example.com/posts/2024/my-article',
            },
        },
        {
            description: 'Article with URL slug extraction (trailing slash)',
            data: {
                '@type': 'Article',
                url: 'https://blog.example.com/my-article/',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://blog.example.com/my-article/',
            },
        },
        {
            description: 'Article with URL slug extraction (deeply nested)',
            data: {
                '@type': 'Article',
                url: 'https://blog.example.com/category/subcategory/year/month/my-article-slug',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'my-article-slug',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://blog.example.com/category/subcategory/year/month/my-article-slug',
            },
        },
        {
            description: 'Article with identifier taking priority over URL',
            data: {
                '@type': 'Article',
                identifier: 'article-id-123',
                url: 'https://example.com/different-slug',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'article-id-123',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/different-slug',
            },
        },
        {
            description: 'BlogPosting with all fields',
            data: {
                '@type': 'BlogPosting',
                identifier: 'croct-launches-new-sdk',
                headline: 'Croct launches new SDK',
                datePublished: '2017-07-12T12:00:00Z',
                dateModified: '2017-07-13T10:00:00Z',
                url: 'https://croct.com/blog/croct-launches-new-sdk',
                keywords: 'startup, product, dev-tools',
                articleSection: ['news', 'updates', 'releases'],
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
            },
            expected: {
                postId: 'croct-launches-new-sdk',
                title: 'Croct launches new SDK',
                publishTime: Date.parse('2017-07-12T12:00:00Z'),
                updateTime: Date.parse('2017-07-13T10:00:00Z'),
                url: 'https://croct.com/blog/croct-launches-new-sdk',
                tags: ['startup', 'product', 'dev-tools'],
                categories: ['news', 'updates', 'releases'],
                authors: ['John Doe', 'Jane Smith'],
            },
        },
        {
            description: 'BlogPosting with dateModified only',
            data: {
                '@type': 'BlogPosting',
                identifier: 'croct-launches-new-sdk',
                headline: 'Croct launches new SDK',
                dateModified: '2017-07-13T10:00:00Z',
                url: 'https://croct.com/blog/croct-launches-new-sdk',
            },
            expected: {
                postId: 'croct-launches-new-sdk',
                title: 'Croct launches new SDK',
                publishTime: Date.parse('2017-07-13T10:00:00Z'),
                url: 'https://croct.com/blog/croct-launches-new-sdk',
            },
        },
        {
            description: 'NewsArticle with dateline and location',
            data: {
                '@type': 'NewsArticle',
                identifier: 'news-001',
                headline: 'Breaking: Major Tech Announcement',
                alternativeHeadline: 'Tech Company Releases New Product',
                datePublished: '2024-01-15T08:00:00Z',
                dateModified: '2024-01-15T10:30:00Z',
                url: 'https://news.example.com/tech-announcement',
                author: [
                    {
                        '@type': 'Person',
                        name: 'Jane Reporter',
                    },
                    {
                        '@type': 'Person',
                        name: 'John Journalist',
                    },
                ],
                articleSection: 'Business',
                keywords: ['technology', 'business', 'innovation'],
                dateline: 'San Francisco, CA',
            },
            expected: {
                postId: 'news-001',
                title: 'Breaking: Major Tech Announcement',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                updateTime: Date.parse('2024-01-15T10:30:00Z'),
                url: 'https://news.example.com/tech-announcement',
                authors: ['Jane Reporter', 'John Journalist'],
                categories: ['Business'],
                tags: ['technology', 'business', 'innovation'],
            },
        },
        {
            description: 'Article with name instead of headline',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                name: 'Article Title',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'article-1',
                title: 'Article Title',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
            },
        },
        {
            description: 'Article with mainEntityOfPage as URL',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': 'https://example.com/article',
                },
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/article',
            },
        },
        {
            description: 'Article with mainEntityOfPage as string URL',
            data: {
                '@type': 'Article',
                url: 'https://example.com/article-slug',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                mainEntityOfPage: 'https://example.com/article',
            },
            expected: {
                postId: 'article-slug',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/article-slug',
            },
        },
        {
            description: 'Article with mainEntityOfPage URL property',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    url: 'https://example.com/article',
                },
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/article',
            },
        },
        {
            description: 'Article extracting slug from mainEntityOfPage',
            data: {
                '@type': 'Article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                mainEntityOfPage: 'https://example.com/blog/my-article',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/blog/my-article',
            },
        },
        {
            description: 'Article with keywords as array',
            data: {
                '@type': 'Article',
                identifier: 'tech-article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                keywords: ['tech', 'innovation', 'ai'],
            },
            expected: {
                postId: 'tech-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                tags: ['tech', 'innovation', 'ai'],
            },
        },
        {
            description: 'Article with keywords as comma-separated string',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                keywords: 'tech, innovation, ai',
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                tags: ['tech', 'innovation', 'ai'],
            },
        },
        {
            description: 'Article with keywords with extra whitespace',
            data: {
                '@type': 'Article',
                url: 'https://example.com/my-article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                keywords: '  tech  ,  innovation  ,  ai  ',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/my-article',
                tags: ['tech', 'innovation', 'ai'],
            },
        },
        {
            description: 'Article with empty keywords filtered out',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                keywords: 'tech, , innovation, , ai',
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                tags: ['tech', 'innovation', 'ai'],
            },
        },
        {
            description: 'Article with single author as string',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                author: 'John Doe',
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                authors: ['John Doe'],
            },
        },
        {
            description: 'Article with single author as object',
            data: {
                '@type': 'Article',
                url: 'https://example.com/article-slug',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                author: {
                    '@type': 'Person',
                    name: 'John Doe',
                },
            },
            expected: {
                postId: 'article-slug',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/article-slug',
                authors: ['John Doe'],
            },
        },
        {
            description: 'Article with multiple authors',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
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
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                authors: ['John Doe', 'Jane Smith'],
            },
        },
        {
            description: 'Article with Organization as author',
            data: {
                '@type': 'Article',
                url: 'https://example.com/company-news',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                author: {
                    '@type': 'Organization',
                    name: 'Tech Company',
                },
            },
            expected: {
                postId: 'company-news',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/company-news',
                authors: ['Tech Company'],
            },
        },
        {
            description: 'Article with creator instead of author',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                creator: {
                    '@type': 'Person',
                    name: 'John Creator',
                },
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                authors: ['John Creator'],
            },
        },
        {
            description: 'Article with mixed author and creator (author wins)',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                author: {
                    '@type': 'Person',
                    name: 'John Author',
                },
                creator: {
                    '@type': 'Person',
                    name: 'John Creator',
                },
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                authors: ['John Author'],
            },
        },
        {
            description: 'Article with genre as category',
            data: {
                '@type': 'Article',
                url: 'https://example.com/tech-news',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                genre: 'Technology',
            },
            expected: {
                postId: 'tech-news',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/tech-news',
                categories: ['Technology'],
            },
        },
        {
            description: 'Article with genre as array',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                genre: ['Technology', 'Innovation'],
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                categories: ['Technology', 'Innovation'],
            },
        },
        {
            description: 'Article with articleSection as string',
            data: {
                '@type': 'Article',
                url: 'https://example.com/article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                articleSection: 'Technology',
            },
            expected: {
                postId: 'article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/article',
                categories: ['Technology'],
            },
        },
        {
            description: 'Article with articleSection as array',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                articleSection: ['Technology', 'Business'],
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                categories: ['Technology', 'Business'],
            },
        },
        {
            description: 'Article with about field as category',
            data: {
                '@type': 'Article',
                url: 'https://example.com/web-dev',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                about: {
                    '@type': 'Thing',
                    name: 'Web Development',
                },
            },
            expected: {
                postId: 'web-dev',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/web-dev',
                categories: ['Web Development'],
            },
        },
        {
            description: 'Article with about as array',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                about: [
                    {
                        '@type': 'Thing',
                        name: 'JavaScript',
                    },
                    {
                        '@type': 'Thing',
                        name: 'TypeScript',
                    },
                ],
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                categories: ['JavaScript', 'TypeScript'],
            },
        },
        {
            description: 'Article with mixed valid categories',
            data: {
                '@type': 'Article',
                url: 'https://example.com/tech-ai',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                articleSection: 'Technology',
                genre: ['News', 'Updates'],
                about: {
                    '@type': 'Thing',
                    name: 'AI',
                },
            },
            expected: {
                postId: 'tech-ai',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/tech-ai',
                categories: ['Technology', 'News', 'Updates', 'AI'],
            },
        },
        {
            description: 'Article with dateCreated fallback',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                dateCreated: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
            },
        },
        {
            description: 'Article with updateTime same as publishTime ignored',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                dateModified: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
            },
        },
        {
            description: 'Article with updateTime before publishTime ignored',
            data: {
                '@type': 'Article',
                url: 'https://example.com/article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                dateModified: '2024-01-14T08:00:00Z',
            },
            expected: {
                postId: 'article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://example.com/article',
            },
        },
        {
            description: 'Article with valid updateTime',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                dateModified: '2024-01-16T10:00:00Z',
            },
            expected: {
                postId: 'article-1',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                updateTime: Date.parse('2024-01-16T10:00:00Z'),
            },
        },
        {
            description: 'Article with invalid URL ignored',
            data: {
                '@type': 'Article',
                identifier: 'my-article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
                url: 'not-a-url',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
            },
        },
        {
            description: 'TechArticle with technical details',
            data: {
                '@type': 'TechArticle',
                url: 'https://docs.example.com/typescript-generics',
                headline: 'Complete Guide to TypeScript Generics',
                datePublished: '2024-03-01T10:00:00Z',
                author: {
                    '@type': 'Person',
                    name: 'Technical Writer',
                },
                keywords: ['typescript', 'generics', 'programming'],
                proficiencyLevel: 'Advanced',
                dependencies: 'TypeScript 5.0+',
            },
            expected: {
                postId: 'typescript-generics',
                title: 'Complete Guide to TypeScript Generics',
                publishTime: Date.parse('2024-03-01T10:00:00Z'),
                url: 'https://docs.example.com/typescript-generics',
                authors: ['Technical Writer'],
                tags: ['typescript', 'generics', 'programming'],
            },
        },
        {
            description: 'Report with comprehensive analysis',
            data: {
                '@type': 'Report',
                identifier: 'report-2024-q1',
                headline: 'Q1 2024 Market Analysis Report',
                datePublished: '2024-04-01T08:00:00Z',
                url: 'https://research.example.com/reports/2024-q1',
                author: [
                    {
                        '@type': 'Person',
                        name: 'Data Analyst',
                    },
                    {
                        '@type': 'Organization',
                        name: 'Research Team',
                    },
                ],
                about: [
                    {
                        '@type': 'Thing',
                        name: 'Market Trends',
                    },
                    {
                        '@type': 'Thing',
                        name: 'Financial Analysis',
                    },
                ],
                reportNumber: '2024-Q1-001',
            },
            expected: {
                postId: 'report-2024-q1',
                title: 'Q1 2024 Market Analysis Report',
                publishTime: Date.parse('2024-04-01T08:00:00Z'),
                url: 'https://research.example.com/reports/2024-q1',
                authors: ['Data Analyst', 'Research Team'],
                categories: ['Market Trends', 'Financial Analysis'],
            },
        },
        {
            description: 'ScholarlyArticle with academic metadata',
            data: {
                '@type': 'ScholarlyArticle',
                identifier: 'doi:10.1234/example.2024.001',
                headline: 'Machine Learning Applications in Healthcare',
                datePublished: '2024-05-15T00:00:00Z',
                url: 'https://journal.example.com/articles/ml-healthcare',
                author: [
                    {
                        '@type': 'Person',
                        name: 'Dr. Emily Research',
                        affiliation: {
                            '@type': 'Organization',
                            name: 'University of Science',
                        },
                    },
                    {
                        '@type': 'Person',
                        name: 'Dr. Michael Studies',
                    },
                ],
                keywords: ['machine learning', 'healthcare', 'AI', 'medical'],
                about: {
                    '@type': 'Thing',
                    name: 'Medical Technology',
                },
                pageStart: '45',
                pageEnd: '67',
            },
            expected: {
                postId: 'doi:10.1234/example.2024.001',
                title: 'Machine Learning Applications in Healthcare',
                publishTime: Date.parse('2024-05-15T00:00:00Z'),
                url: 'https://journal.example.com/articles/ml-healthcare',
                authors: ['Dr. Emily Research', 'Dr. Michael Studies'],
                tags: ['machine learning', 'healthcare', 'AI', 'medical'],
                categories: ['Medical Technology'],
            },
        },
        {
            description: 'SocialMediaPosting with engagement data',
            data: {
                '@type': 'SocialMediaPosting',
                url: 'https://social.example.com/posts/12345',
                headline: 'Exciting Product Launch Announcement',
                datePublished: '2024-06-01T15:30:00Z',
                author: {
                    '@type': 'Organization',
                    name: 'Tech Company',
                },
                keywords: ['product launch', 'announcement', 'innovation'],
                sharedContent: {
                    '@type': 'WebPage',
                    url: 'https://company.example.com/new-product',
                },
            },
            expected: {
                postId: '12345',
                title: 'Exciting Product Launch Announcement',
                publishTime: Date.parse('2024-06-01T15:30:00Z'),
                url: 'https://social.example.com/posts/12345',
                authors: ['Tech Company'],
                tags: ['product launch', 'announcement', 'innovation'],
            },
        },
        {
            description: 'OpinionNewsArticle with editorial content',
            data: {
                '@type': 'OpinionNewsArticle',
                url: 'https://opinion.example.com/remote-work-future',
                headline: 'Why Remote Work Is Here to Stay',
                datePublished: '2024-07-01T09:00:00Z',
                author: {
                    '@type': 'Person',
                    name: 'Editorial Columnist',
                },
                articleSection: 'Opinion',
                genre: 'Editorial',
                keywords: 'remote work, future of work, workplace',
            },
            expected: {
                postId: 'remote-work-future',
                title: 'Why Remote Work Is Here to Stay',
                publishTime: Date.parse('2024-07-01T09:00:00Z'),
                url: 'https://opinion.example.com/remote-work-future',
                authors: ['Editorial Columnist'],
                categories: ['Opinion', 'Editorial'],
                tags: ['remote work', 'future of work', 'workplace'],
            },
        },
        {
            description: 'ReviewNewsArticle with review content',
            data: {
                '@type': 'ReviewNewsArticle',
                identifier: 'review-001',
                headline: 'iPhone 15 Pro Review: A Comprehensive Look',
                datePublished: '2024-08-01T10:00:00Z',
                url: 'https://reviews.example.com/iphone-15-pro',
                author: {
                    '@type': 'Person',
                    name: 'Tech Reviewer',
                },
                articleSection: 'Reviews',
                keywords: ['iPhone', 'review', 'smartphone', 'Apple'],
                itemReviewed: {
                    '@type': 'Product',
                    name: 'iPhone 15 Pro',
                },
            },
            expected: {
                postId: 'review-001',
                title: 'iPhone 15 Pro Review: A Comprehensive Look',
                publishTime: Date.parse('2024-08-01T10:00:00Z'),
                url: 'https://reviews.example.com/iphone-15-pro',
                authors: ['Tech Reviewer'],
                categories: ['Reviews'],
                tags: ['iPhone', 'review', 'smartphone', 'Apple'],
            },
        },
        {
            description: 'AnalysisNewsArticle with in-depth analysis',
            data: {
                '@type': 'AnalysisNewsArticle',
                url: 'https://analysis.example.com/ai-job-impact',
                headline: 'Understanding the Impact of AI on Job Markets',
                datePublished: '2024-09-01T08:00:00Z',
                dateModified: '2024-09-05T12:00:00Z',
                author: [
                    {
                        '@type': 'Person',
                        name: 'Economic Analyst',
                    },
                ],
                articleSection: 'Analysis',
                keywords: ['AI', 'employment', 'economics', 'future'],
                about: [
                    {
                        '@type': 'Thing',
                        name: 'Artificial Intelligence',
                    },
                    {
                        '@type': 'Thing',
                        name: 'Labor Economics',
                    },
                ],
            },
            expected: {
                postId: 'ai-job-impact',
                title: 'Understanding the Impact of AI on Job Markets',
                publishTime: Date.parse('2024-09-01T08:00:00Z'),
                updateTime: Date.parse('2024-09-05T12:00:00Z'),
                url: 'https://analysis.example.com/ai-job-impact',
                authors: ['Economic Analyst'],
                categories: ['Analysis', 'Artificial Intelligence', 'Labor Economics'],
                tags: ['AI', 'employment', 'economics', 'future'],
            },
        },
        {
            description: 'BackgroundNewsArticle with context',
            data: {
                '@type': 'BackgroundNewsArticle',
                identifier: 'background-001',
                headline: 'The History of Cryptocurrency: From Bitcoin to Today',
                datePublished: '2024-10-01T09:00:00Z',
                url: 'https://news.example.com/crypto-history',
                author: {
                    '@type': 'Person',
                    name: 'Financial Journalist',
                },
                articleSection: 'Background',
                keywords: ['cryptocurrency', 'Bitcoin', 'blockchain', 'history'],
            },
            expected: {
                postId: 'background-001',
                title: 'The History of Cryptocurrency: From Bitcoin to Today',
                publishTime: Date.parse('2024-10-01T09:00:00Z'),
                url: 'https://news.example.com/crypto-history',
                authors: ['Financial Journalist'],
                categories: ['Background'],
                tags: ['cryptocurrency', 'Bitcoin', 'blockchain', 'history'],
            },
        },
        {
            description: 'AdvertiserContentArticle with sponsored content',
            data: {
                '@type': 'AdvertiserContentArticle',
                url: 'https://content.example.com/business-growth',
                headline: 'How Our Platform Helps Businesses Grow',
                datePublished: '2024-11-01T10:00:00Z',
                author: {
                    '@type': 'Organization',
                    name: 'SaaS Company',
                },
                articleSection: 'Sponsored',
                keywords: ['business', 'growth', 'SaaS', 'productivity'],
            },
            expected: {
                postId: 'business-growth',
                title: 'How Our Platform Helps Businesses Grow',
                publishTime: Date.parse('2024-11-01T10:00:00Z'),
                url: 'https://content.example.com/business-growth',
                authors: ['SaaS Company'],
                categories: ['Sponsored'],
                tags: ['business', 'growth', 'SaaS', 'productivity'],
            },
        },
        {
            description: 'SatiricalArticle with humor content',
            data: {
                '@type': 'SatiricalArticle',
                identifier: 'satire-001',
                headline: 'Area Man Discovers Revolutionary Way to Avoid Meetings',
                datePublished: '2024-12-01T12:00:00Z',
                url: 'https://satire.example.com/avoid-meetings',
                author: {
                    '@type': 'Person',
                    name: 'Comedy Writer',
                },
                articleSection: 'Satire',
                genre: 'Comedy',
                keywords: ['humor', 'workplace', 'satire'],
            },
            expected: {
                postId: 'satire-001',
                title: 'Area Man Discovers Revolutionary Way to Avoid Meetings',
                publishTime: Date.parse('2024-12-01T12:00:00Z'),
                url: 'https://satire.example.com/avoid-meetings',
                authors: ['Comedy Writer'],
                categories: ['Satire', 'Comedy'],
                tags: ['humor', 'workplace', 'satire'],
            },
        },
        {
            description: 'APIReference technical documentation',
            data: {
                '@type': 'APIReference',
                url: 'https://docs.example.com/api/v2',
                headline: 'REST API v2.0 Documentation',
                datePublished: '2024-01-10T08:00:00Z',
                dateModified: '2024-11-01T10:00:00Z',
                author: {
                    '@type': 'Organization',
                    name: 'Engineering Team',
                },
                programmingModel: 'REST',
                assemblyVersion: '2.0.0',
            },
            expected: {
                postId: 'v2',
                title: 'REST API v2.0 Documentation',
                publishTime: Date.parse('2024-01-10T08:00:00Z'),
                updateTime: Date.parse('2024-11-01T10:00:00Z'),
                url: 'https://docs.example.com/api/v2',
                authors: ['Engineering Team'],
            },
        },
        {
            description: 'DiscussionForumPosting from community',
            data: {
                '@type': 'DiscussionForumPosting',
                identifier: 'forum-post-456',
                headline: 'Best Practices for React Hooks',
                datePublished: '2024-02-20T14:30:00Z',
                url: 'https://forum.example.com/posts/456',
                author: {
                    '@type': 'Person',
                    name: 'Community Member',
                },
                keywords: ['React', 'hooks', 'best practices', 'JavaScript'],
            },
            expected: {
                postId: 'forum-post-456',
                title: 'Best Practices for React Hooks',
                publishTime: Date.parse('2024-02-20T14:30:00Z'),
                url: 'https://forum.example.com/posts/456',
                authors: ['Community Member'],
                tags: ['React', 'hooks', 'best practices', 'JavaScript'],
            },
        },
        {
            description: 'LiveBlogPosting with real-time updates',
            data: {
                '@type': 'LiveBlogPosting',
                url: 'https://live.example.com/launch-event',
                headline: 'Live: Product Launch Event 2024',
                datePublished: '2024-03-15T16:00:00Z',
                dateModified: '2024-03-15T18:30:00Z',
                author: [
                    {
                        '@type': 'Person',
                        name: 'Live Reporter 1',
                    },
                    {
                        '@type': 'Person',
                        name: 'Live Reporter 2',
                    },
                ],
                coverageStartTime: '2024-03-15T16:00:00Z',
                coverageEndTime: '2024-03-15T18:30:00Z',
                keywords: ['live', 'product launch', 'event'],
            },
            expected: {
                postId: 'launch-event',
                title: 'Live: Product Launch Event 2024',
                publishTime: Date.parse('2024-03-15T16:00:00Z'),
                updateTime: Date.parse('2024-03-15T18:30:00Z'),
                url: 'https://live.example.com/launch-event',
                authors: ['Live Reporter 1', 'Live Reporter 2'],
                tags: ['live', 'product launch', 'event'],
            },
        },
        {
            description: 'Article with URL containing query parameters',
            data: {
                '@type': 'Article',
                url: 'https://blog.example.com/my-article?utm_source=twitter&utm_medium=social',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://blog.example.com/my-article?utm_source=twitter&utm_medium=social',
            },
        },
        {
            description: 'Article with URL containing hash fragment',
            data: {
                '@type': 'Article',
                url: 'https://blog.example.com/my-article#section-2',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: {
                postId: 'my-article',
                title: 'Test Article',
                publishTime: Date.parse('2024-01-15T08:00:00Z'),
                url: 'https://blog.example.com/my-article#section-2',
            },
        },
        {
            description: 'Article with no publish time if missing datePublished and dateCreated',
            data: {
                '@type': 'Article',
                identifier: 'article-slug',
                headline: 'Test Article',
            },
            expected: {
                postId: 'article-slug',
                title: 'Test Article',
            },
        },
        {
            description: 'Article with no publish time if invalid datePublished',
            data: {
                '@type': 'Article',
                identifier: 'article-slug',
                headline: 'Test Article',
                datePublished: 'invalid-date',
            },
            expected: {
                postId: 'article-slug',
                title: 'Test Article',
            },
        },
        {
            description: 'null for missing postId',
            data: {
                '@type': 'Article',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: null,
        },
        {
            description: 'null for URL with no path segments',
            data: {
                '@type': 'Article',
                url: 'https://example.com/',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: null,
        },
        {
            description: 'null for URL with only root path',
            data: {
                '@type': 'Article',
                url: 'https://example.com',
                headline: 'Test Article',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: null,
        },
        {
            description: 'null for missing title',
            data: {
                '@type': 'Article',
                identifier: 'article-1',
                datePublished: '2024-01-15T08:00:00Z',
            },
            expected: null,
        },
    ])('should extract $description', ({data, expected}) => {
        expect(extractArticle(data as any)).toEqual(expected);
    });
});
