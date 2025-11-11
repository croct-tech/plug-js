import {JsonObject, JsonValue} from '@croct/json';

export type ProductInfo = {
    productId: string,
    sku?: string,
    name: string,
    category?: string,
    brand?: string,
    variant?: string,
    displayPrice: number,
    originalPrice?: number,
    url?: string,
    imageUrl?: string,
};

export function extractProductInfo(data: JsonObject): ProductInfo | null {
    const productSku = getValue(data, 'sku');
    const productId = getValue(data, 'productID') ?? productSku;
    const productName = getValue(data, 'name');

    // Validate required fields
    if (typeof productId !== 'string' || typeof productName !== 'string') {
        return null;
    }

    // Extract price information
    const prices: number[] = [];
    const urls: string[] = [];

    // Handle null/undefined offers
    const offersList = Array.isArray(data.offers) ? data.offers : [data.offers];

    for (const offer of offersList) {
        if (!isObject(offer)) {
            continue;
        }

        const url = getValue(offer, 'url');

        if (typeof url === 'string') {
            urls.push(url);
        }

        for (const key of ['price', 'lowPrice', 'highPrice']) {
            const value = parseNumber(getValue(offer, key));

            if (value !== null && value >= 0) {
                prices.push(value);
            }
        }

        const specifications = getValue(offer, 'priceSpecification');
        const specList = Array.isArray(specifications) ? specifications : [specifications];

        for (const specification of specList) {
            if (!isObject(specification)) {
                continue;
            }

            for (const key of ['price', 'minPrice', 'maxPrice']) {
                const value = parseNumber(getValue(specification, key));

                if (value !== null && value >= 0) {
                    prices.push(value);
                }
            }
        }
    }

    if (prices.length === 0) {
        return null;
    }

    const displayPrice = Math.min(...prices);
    const originalPrice = Math.max(...prices);

    // Build product object with all extracted data
    const product: ProductInfo = {
        productId: productId,
        name: productName,
        displayPrice: displayPrice,
    };

    // Extract variant information
    const variant: string[] = [];

    const color = getValue(data, 'color');

    if (typeof color === 'string') {
        variant.push(color);
    }

    const size = getValue(data, 'size');

    if (typeof size === 'string') {
        variant.push(size);
    } else if (isObject(size)) {
        const sizeName = getValue(size, 'name');

        if (typeof sizeName === 'string') {
            variant.push(sizeName);
        }
    }

    const material = getValue(data, 'material');

    if (typeof material === 'string') {
        variant.push(material);
    } else if (isObject(material)) {
        const materialName = getValue(material, 'name');

        if (typeof materialName === 'string') {
            variant.push(materialName);
        }
    }

    if (variant.length > 0) {
        product.variant = variant.join(', ');
    }

    // Only set originalPrice if it's meaningfully different
    if (originalPrice > displayPrice) {
        product.originalPrice = originalPrice;
    }

    if (typeof productSku === 'string' && productSku.length > 0) {
        product.sku = productSku;
    }

    const category = getValue(data, 'category');

    if (typeof category === 'string') {
        product.category = category;
    } else if (isObject(category)) {
        const name = getValue(category, 'name');

        if (typeof name === 'string') {
            product.category = name;
        }
    }

    const brand = getValue(data, 'brand');

    if (typeof brand === 'string') {
        product.brand = brand;
    } else if (isObject(brand)) {
        const name = getValue(brand, 'name');

        if (typeof name === 'string') {
            product.brand = name;
        }
    }

    const productUrl = getValue(data, 'url');

    if (typeof productUrl === 'string') {
        // Prioritize product URL over offer URLs
        urls.unshift(productUrl);
    }

    for (const url of urls) {
        if (URL.canParse(url)) {
            product.url = url;

            break;
        }
    }

    const images = Array.isArray(data.image) ? data.image : [data.image];

    for (const image of images) {
        if (typeof image === 'string' && URL.canParse(image)) {
            product.imageUrl = image;

            break;
        }

        if (isObject(image)) {
            const imageUrl = getValue(image, 'url');

            if (typeof imageUrl === 'string' && URL.canParse(imageUrl)) {
                product.imageUrl = imageUrl;

                break;
            }
        }
    }

    return product;
}

function isObject(value: JsonValue | unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const parsedValue = Number.parseFloat(value);

        if (!Number.isNaN(parsedValue)) {
            return parsedValue;
        }
    }

    return null;
}

function getValue(object: JsonObject, ...keys: string[]): JsonValue | null {
    for (const key of keys) {
        const value = object[key];

        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            continue;
        }

        return value;
    }

    return null;
}
