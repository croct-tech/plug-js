import {JsonObject, JsonValue} from '@croct/json';

type EntityMap = {
    article: ArticleEntity,
    product: ProductEntity,
};

export type EntityType = keyof EntityMap;

export type Entity<T extends EntityType = EntityType> = {
    [K in T]: {type: K} & EntityMap[K];
}[T];

const articleTypes = new Set([
    'Article',
    'NewsArticle',
    'BlogPosting',
    'ScholarlyArticle',
    'TechArticle',
    'Report',
    'SocialMediaPosting',
    'OpinionNewsArticle',
    'ReviewNewsArticle',
    'AnalysisNewsArticle',
    'BackgroundNewsArticle',
    'AdvertiserContentArticle',
    'SatiricalArticle',
    'APIReference',
    'DiscussionForumPosting',
    'LiveBlogPosting',
]);

const productTypes = new Set([
    'Product',
    'ProductModel',
    'ProductGroup',
    'SomeProducts',
    'Vehicle',
    'Car',
    'Motorcycle',
    'IndividualProduct',
]);

export function parseEntity(content: string): Entity | null {
    const data = parseJsonLd(content);

    if (data === null) {
        return null;
    }

    return extractEntity(data);
}

export function extractEntity(data: JsonObject): Entity | null {
    const type = getValue(data, '@type');

    if (contains(productTypes, type)) {
        const product = extractProduct(data);

        if (product !== null) {
            return {type: 'product', ...product};
        }
    }

    if (contains(articleTypes, type)) {
        const article = extractArticle(data);

        if (article !== null) {
            return {type: 'article', ...article};
        }
    }

    return null;
}

export type ArticleEntity = {
    postId: string,
    url?: string,
    title: string,
    tags?: string[],
    categories?: string[],
    authors?: string[],
    publishTime?: number,
    updateTime?: number,
};

export function extractArticle(data: JsonObject): ArticleEntity | null {
    // Extract ID - try multiple possible fields
    let postId = getValue(data, 'identifier');
    const url = getValue(data, 'url', 'mainEntityOfPage');

    if (typeof postId !== 'string' && typeof url === 'string' && URL.canParse(url)) {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname
            .split('/')
            .filter(segment => segment.length > 0);

        if (pathSegments.length > 0) {
            postId = pathSegments[pathSegments.length - 1];
        }
    }

    // Extract title
    const title = getValue(data, 'headline', 'name');

    // Validate required fields
    if (typeof postId !== 'string' || typeof title !== 'string') {
        return null;
    }

    const post: ArticleEntity = {
        postId: postId,
        title: title,
    };

    const datePublished = getValue(data, 'datePublished', 'dateCreated');
    const dateModified = getValue(data, 'dateModified');
    const updateTime = parseTimestamp(dateModified);
    const publishTime = parseTimestamp(datePublished) ?? updateTime;

    if (publishTime !== null) {
        post.publishTime = publishTime;

        if (updateTime !== null && updateTime > publishTime) {
            post.updateTime = updateTime;
        }
    }

    if (typeof url === 'string' && URL.canParse(url)) {
        post.url = url;
    } else if (isObject(url)) {
        const urlValue = getValue(url, 'url', '@id');

        if (typeof urlValue === 'string' && URL.canParse(urlValue)) {
            post.url = urlValue;
        }
    }

    // Extract tags (keywords)
    const tags: string[] = [];
    const keywords = getValue(data, 'keywords');

    if (typeof keywords === 'string') {
        tags.push(
            ...keywords.split(',')
                .map(keyword => keyword.trim())
                .filter(keyword => keyword.length > 0),
        );
    } else if (Array.isArray(keywords)) {
        for (const keyword of keywords) {
            if (typeof keyword === 'string') {
                tags.push(keyword);
            }
        }
    }

    if (tags.length > 0) {
        post.tags = tags;
    }

    // Extract categories (articleSection, genre, about)
    const categories: string[] = [];

    for (const key of ['articleSection', 'genre']) {
        const value = getValue(data, key);

        if (typeof value === 'string') {
            categories.push(value);
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'string') {
                    categories.push(item);
                }
            }
        }
    }

    // Also check 'about' field for additional categories
    const about = getValue(data, 'about');

    if (isObject(about)) {
        const aboutName = getValue(about, 'name');

        if (typeof aboutName === 'string') {
            categories.push(aboutName);
        }
    } else if (Array.isArray(about)) {
        for (const item of about) {
            if (isObject(item)) {
                const itemName = getValue(item, 'name');

                if (typeof itemName === 'string') {
                    categories.push(itemName);
                }
            }
        }
    }

    if (categories.length > 0) {
        post.categories = categories;
    }

    // Extract authors
    const authors: string[] = [];
    const authorData = getValue(data, 'author', 'creator');
    const authorList = Array.isArray(authorData) ? authorData : [authorData];

    for (const author of authorList) {
        if (typeof author === 'string') {
            authors.push(author);
        } else if (isObject(author)) {
            const name = getValue(author, 'name');

            if (typeof name === 'string') {
                authors.push(name);
            }
        }
    }

    if (authors.length > 0) {
        post.authors = authors;
    }

    return post;
}

function parseTimestamp(value: unknown): number | null {
    if (typeof value === 'string') {
        // Parse ISO 8601 date string
        const date = Date.parse(value);

        if (!Number.isNaN(date)) {
            return date;
        }
    }

    return null;
}

export type ProductEntity = {
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

export function extractProduct(data: JsonObject): ProductEntity | null {
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
    const product: ProductEntity = {
        productId: productId,
        name: productName,
        displayPrice: displayPrice,
    };

    // Extract variant information
    const variant: string[] = [];

    for (const key of ['color', 'pattern', 'size', 'material', 'model']) {
        const value = getValue(data, key);

        if (typeof value === 'string') {
            variant.push(value);
        } else if (isObject(value)) {
            const name = getValue(value, 'name');

            if (typeof name === 'string') {
                variant.push(name);
            }
        }
    }

    if (variant.length > 0) {
        product.variant = variant.join(', ');
    }

    // Only set originalPrice if it's meaningfully different
    if (originalPrice > displayPrice) {
        product.originalPrice = originalPrice;
    }

    if (typeof productSku === 'string') {
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

function parseJsonLd(content: string): JsonObject | null {
    try {
        const data = JSON.parse(content);

        if (isObject(data)) {
            return data;
        }
    } catch {
        // Ignore parsing errors
    }

    return null;
}

function contains(set: Set<JsonValue>, value: JsonValue): boolean {
    if (typeof value === 'string') {
        return set.has(value);
    }

    return false;
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
