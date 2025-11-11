/**
 * @jest-environment node
 */

import {Product} from 'schema-dts';
import {extractProductInfo, ProductInfo} from '../../../src/plugins/autoTracking/structuredData';

describe('extractProductInfo', () => {
    type ProductScenario = {
        description: string,
        data: Product,
        expected: ProductInfo | null,
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
            description: 'product with multiple variants',
            data: {
                '@type': 'Product',
                productID: '12345',
                name: 'Test Product',
                color: 'Red',
                size: 'Large',
                material: 'Cotton',
                offers: {
                    '@type': 'Offer',
                    price: 100,
                },
            },
            expected: {
                productId: '12345',
                name: 'Test Product',
                variant: 'Red, Large, Cotton',
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
        expect(extractProductInfo(data as any)).toEqual(expected);
    });
});
